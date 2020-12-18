import React, { useState } from "react";
import * as ReactKonva from "react-konva";
import { Image } from "../../types/Image";
import useImage from "use-image";
import { Stage } from "konva/types/Stage";
import { Circle } from "konva/types/shapes/Circle";
import { Transformer } from "konva/types/shapes/Transformer";
import { Group } from "konva/types/Group";
import * as _ from "underscore";
import { Line } from "konva/types/shapes/Line";

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

type KonvaLassoSelectionCanvasProps = {
  image: Image;
};

type Stroke = {
  method: Method;
  points: Array<number>;
};

const MarchingAnts = ({ stroke }: { stroke: Stroke }) => {
  React.useEffect(() => {
    setTimeout(() => {
      setDashOffset(dashOffset + 1);

      if (dashOffset > 16) {
        setDashOffset(0);
      }
    }, 20);
  });

  const [dashOffset, setDashOffset] = React.useState();

  return (
    <React.Fragment>
      <ReactKonva.Line
        fillEnabled={false}
        points={stroke.points}
        stroke="#FFF"
        strokeWidth={1}
      />

      <ReactKonva.Line
        dash={[4, 2]}
        dashOffset={dashOffset}
        fillEnabled={false}
        points={stroke.points}
        stroke="#000"
        strokeWidth={1}
      />
    </React.Fragment>
  );
};

export const KonvaLassoSelectionCanvas = ({
  image,
}: KonvaLassoSelectionCanvasProps) => {
  const [img] = useImage(image.src);

  const stage = React.useRef<Stage>(null);
  const startingAnchorCircle = React.useRef<Circle>(null);
  const transformer = React.useRef<Transformer>(null);
  const group = React.useRef<Group>(null);
  const annotationRef = React.useRef<Line>(null);

  const [anchor, setAnchor] = useState<Anchor>();
  const [annotated, setAnnotated] = useState<boolean>(false);
  const [annotating, setAnnotating] = useState<boolean>(false);
  const [annotation, setAnnotation] = useState<Stroke>();
  const [start, setStart] = useState<Anchor>();
  const [strokes, setStrokes] = useState<Array<Stroke>>([]);

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

  const connected = (position: { x: number; y: number }) => {
    if (startingAnchorCircle && startingAnchorCircle.current) {
      const rectangle = startingAnchorCircle.current.getClientRect();

      const inside =
        rectangle.x <= position.x &&
        position.x <= rectangle.x + rectangle.width &&
        rectangle.y <= position.y &&
        position.y <= rectangle.y + rectangle.height;

      if (strokes && strokes.length > 0) {
        return inside && strokes[0].points.length > 32;
      }
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
          } else {
            setAnnotating(true);

            setStart(position);

            const stroke: Stroke = {
              method: Method.Lasso,
              points: [position.x, position.y],
            };

            setStrokes([...strokes, stroke]);
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
        if (anchor) {
          const stroke = {
            method: Method.Lasso,
            points: [anchor.x, anchor.y, position.x, position.y],
          };

          if (strokes.length > 2) {
            strokes.splice(strokes.length - 1, 1, stroke);

            setStrokes(strokes.concat());
          } else {
            setStrokes([...strokes, stroke]);
          }
        } else {
          let stroke = strokes[strokes.length - 1];

          stroke.points = [...stroke.points, position.x, position.y];

          strokes.splice(strokes.length - 1, 1, stroke);

          setStrokes(strokes.concat());

          if (connected(position)) {
            //  TODO:
          } else {
            //  TODO:
          }
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
          setAnchor(position);
        }
      }
    }
  };

  const Anchor = () => {
    if (annotating && anchor) {
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
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      ref={stage}
      width={image.shape?.c}
    >
      <ReactKonva.Layer>
        <ReactKonva.Image image={img} />

        <StartingAnchor />

        {!annotated &&
          annotating &&
          strokes.map((stroke: Stroke, key: number) => (
            <MarchingAnts key={key} stroke={stroke} />
          ))}

        <Anchor />

        <ReactKonva.Group draggable ref={group}>
          {annotation && annotated && !annotating && (
            <MarchingAnts stroke={annotation} />
          )}
        </ReactKonva.Group>

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
