import React, { useState } from "react";
import * as ReactKonva from "react-konva";
import { Image } from "../../../types/Image";
import useImage from "use-image";
import { Stage } from "konva/types/Stage";
import { Circle } from "konva/types/shapes/Circle";
import { Transformer } from "konva/types/shapes/Transformer";
import * as _ from "underscore";
import { Line } from "konva/types/shapes/Line";
import { toRGBA } from "../../../image/toRGBA";
import { Category } from "../../../types/Category";

export enum Method {
  Elliptical,
  Lasso,
  Magnetic,
  Polygonal,
  Quick,
  Rectangular,
}

type Anchor = {
  x: number;
  y: number;
};

type PolygonalSelectionProps = {
  image: Image;
  category: Category;
};

type Stroke = {
  method: Method;
  points: Array<number>;
};

type MarchingAntsProps = {
  closed: boolean;
  color: string;
  stroke: Stroke;
};

const MarchingAnts = ({ closed, color, stroke }: MarchingAntsProps) => {
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(offset + 1);
      if (offset > 32) {
        setOffset(0);
      }
    }, 200);

    return () => clearTimeout(timer);
  });

  return (
    <React.Fragment>
      <ReactKonva.Line points={stroke.points} stroke="black" strokeWidth={1} />

      <ReactKonva.Line
        dash={[4, 2]}
        dashOffset={-offset}
        points={stroke.points}
        stroke="white"
        strokeWidth={1}
        closed={closed}
        fill={color}
      />
    </React.Fragment>
  );
};

export const PolygonalSelection = ({
  image,
  category,
}: PolygonalSelectionProps) => {
  const [img] = useImage(image.src);

  const stage = React.useRef<Stage>(null);
  const startingAnchorCircle = React.useRef<Circle>(null);
  const transformer = React.useRef<Transformer>(null);
  const annotationRef = React.useRef<Line>(null);

  const [anchor, setAnchor] = useState<Anchor>();
  const [annotated, setAnnotated] = useState<boolean>(false);
  const [annotating, setAnnotating] = useState<boolean>(false);
  const [annotation, setAnnotation] = useState<Stroke>();
  const [start, setStart] = useState<Anchor>();
  const [strokes, setStrokes] = useState<Array<Stroke>>([]);

  const [canClose, setCanClose] = useState<boolean>(false);

  const [offset, setOffset] = useState<number>(0);

  React.useEffect(() => {
    if (
      annotated &&
      annotationRef &&
      annotationRef.current &&
      transformer &&
      transformer.current
    ) {
      transformer.current.nodes([annotationRef.current]);

      transformer.current.getLayer()?.batchDraw();
    }
  }, [annotated]);

  const isInside = (
    startingAnchorCircle: React.RefObject<Circle>,
    position: { x: number; y: number }
  ) => {
    if (startingAnchorCircle && startingAnchorCircle.current) {
      const rectangle = startingAnchorCircle.current.getClientRect();
      return (
        rectangle.x <= position.x &&
        position.x <= rectangle.x + rectangle.width &&
        rectangle.y <= position.y &&
        position.y <= rectangle.y + rectangle.height
      );
    } else {
      return false;
    }
  };

  const connected = (position: { x: number; y: number }) => {
    const inside = isInside(startingAnchorCircle, position);
    if (strokes && strokes.length > 0) {
      return inside && canClose;
    }
  };

  const onMouseDown = () => {
    if (annotated) return;

    if (stage && stage.current) {
      const position = stage.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
          const stroke: Stroke = {
            method: Method.Lasso,
            points: _.flatten(strokes.map((stroke: Stroke) => stroke.points)),
          };

          setAnnotated(true);
          setAnnotating(false);
          setAnnotation(stroke);
          setStrokes([]);
        } else {
          if (anchor) {
            const stroke = {
              method: Method.Lasso,
              points: [anchor.x, anchor.y, position.x, position.y],
            };

            setStrokes([...strokes, stroke]);

            setAnchor(position);
          } else if (start) {
            const stroke = {
              method: Method.Lasso,
              points: [start.x, start.y, position.x, position.y],
            };

            setStrokes([...strokes, stroke]);
            setAnchor(position);
          } else {
            setAnnotating(true);
            setStart(position);
          }
        }
      }
    }
  };

  const onMouseMove = () => {
    if (annotated) return;

    if (!annotating) return;

    if (stage && stage.current) {
      const position = stage.current.getPointerPosition();

      if (position) {
        if (!canClose && !isInside(startingAnchorCircle, position)) {
          setCanClose(true);
        }

        if (anchor) {
          const stroke = {
            method: Method.Lasso,
            points: [anchor.x, anchor.y, position.x, position.y],
          };
          strokes.splice(strokes.length - 1, 1, stroke);
          setStrokes(strokes.concat());
        } else if (start) {
          const stroke = {
            method: Method.Lasso,
            points: [start.x, start.y, position.x, position.y],
          };
          strokes.splice(strokes.length - 1, 1, stroke);
          setStrokes(strokes.concat());
        }
      }
    }
  };

  const onMouseUp = () => {
    if (annotated) return;

    if (!annotating) return;

    if (stage && stage.current) {
      const position = stage.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
          if (start) {
            const stroke = {
              method: Method.Lasso,
              points: [position.x, position.y, start.x, start.y],
            };

            setStrokes([...strokes, stroke]);
          }

          const stroke: Stroke = {
            method: Method.Lasso,
            points: _.flatten(strokes.map((stroke: Stroke) => stroke.points)),
          };

          setAnnotated(true);
          setAnnotating(false);
          setAnnotation(stroke);
          setStrokes([]);
        } else {
          if (strokes.length === 1) {
            setAnchor(position);
            if (start) {
              const stroke = {
                method: Method.Lasso,
                points: [start!.x, start!.y, position.x, position.y],
              };
              setStrokes([...strokes, stroke]);
            }
          }
        }
      }
    }
  };

  const Anchor = () => {
    if (annotating && anchor && strokes.length > 1) {
      return (
        <ReactKonva.Circle
          fill="#FFF"
          name="anchor"
          radius={3}
          stroke="#FFF"
          strokeWidth={1}
          x={anchor.x}
          y={anchor.y}
        />
      );
    } else {
      return <React.Fragment />;
    }
  };

  const StartingAnchor = () => {
    if (annotating && start) {
      return (
        <ReactKonva.Circle
          fill="#000"
          globalCompositeOperation="source-over"
          hitStrokeWidth={64}
          id="start"
          name="anchor"
          radius={3}
          ref={startingAnchorCircle}
          stroke="#FFF"
          strokeWidth={1}
          x={start.x}
          y={start.y}
        />
      );
    } else {
      return <React.Fragment />;
    }
  };

  return (
    <ReactKonva.Stage
      globalCompositeOperation="destination-over"
      height={image.shape?.r}
      ref={stage}
      width={image.shape?.c}
    >
      <ReactKonva.Layer
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <ReactKonva.Image image={img} />

        <StartingAnchor />

        {!annotated &&
          annotating &&
          strokes.map((stroke: Stroke, key: number) => (
            <MarchingAnts
              key={key}
              color="None"
              closed={false}
              stroke={stroke}
            />
          ))}

        <Anchor />

        {annotation && annotated && !annotating && (
          <MarchingAnts
            color={toRGBA(category.color, 0.3)}
            closed={true}
            stroke={annotation}
          />
        )}

        <ReactKonva.Transformer
          anchorFill="#FFF"
          anchorStroke="#000"
          anchorStrokeWidth={1}
          anchorSize={6}
          borderEnabled={false}
          ref={transformer}
          rotateEnabled={false}
        />
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
