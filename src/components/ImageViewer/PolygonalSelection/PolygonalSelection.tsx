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

type PolygonalSelectionAnchor = {
  x: number;
  y: number;
};

type PolygonalSelectionProps = {
  image: Image;
  category: Category;
};

type PolygonalSelectionStroke = {
  points: Array<number>;
};

type MarchingAntsProps = {
  closed: boolean;
  color: string;
  stroke: PolygonalSelectionStroke;
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

  const stageRef = React.useRef<Stage>(null);
  const transformerRef = React.useRef<Transformer>(null);

  const polygonalSelectionRef = React.useRef<Line>(null);
  const polygonalSelectionStartingAnchorCircleRef = React.useRef<Circle>(null);

  const [annotated, setAnnotated] = useState<boolean>(false);
  const [annotating, setAnnotating] = useState<boolean>(false);

  const [
    polygonalSelectionAnchor,
    setPolygonalSelectionAnchor,
  ] = useState<PolygonalSelectionAnchor>();
  const [
    polygonalSelectionAnnotation,
    setPolygonalSelectionAnnotation,
  ] = useState<PolygonalSelectionStroke>();
  const [
    polygonalSelectionStart,
    setPolygonalSelectionStart,
  ] = useState<PolygonalSelectionAnchor>();
  const [polygonalSelectionStrokes, setPolygonalSelectionStrokes] = useState<
    Array<PolygonalSelectionStroke>
  >([]);
  const [
    polygonalSelectionCanClose,
    setPolygonalSelectionCanClose,
  ] = useState<boolean>(false);

  const [offset, setOffset] = useState<number>(0);

  React.useEffect(() => {
    if (
      annotated &&
      polygonalSelectionRef &&
      polygonalSelectionRef.current &&
      transformerRef &&
      transformerRef.current
    ) {
      transformerRef.current.nodes([polygonalSelectionRef.current]);

      transformerRef.current.getLayer()?.batchDraw();
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
    const inside = isInside(
      polygonalSelectionStartingAnchorCircleRef,
      position
    );
    if (polygonalSelectionStrokes && polygonalSelectionStrokes.length > 0) {
      return inside && polygonalSelectionCanClose;
    }
  };

  const onPolygonalSelectionMouseDown = () => {
    if (annotated) {
      return;
    }

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
          const stroke: PolygonalSelectionStroke = {
            points: _.flatten(
              polygonalSelectionStrokes.map(
                (stroke: PolygonalSelectionStroke) => stroke.points
              )
            ),
          };

          setAnnotated(true);

          setAnnotating(false);

          setPolygonalSelectionAnnotation(stroke);

          setPolygonalSelectionStrokes([]);
        } else {
          if (polygonalSelectionAnchor) {
            const stroke = {
              points: [
                polygonalSelectionAnchor.x,
                polygonalSelectionAnchor.y,
                position.x,
                position.y,
              ],
            };

            setPolygonalSelectionStrokes([
              ...polygonalSelectionStrokes,
              stroke,
            ]);

            setPolygonalSelectionAnchor(position);
          } else if (polygonalSelectionStart) {
            const stroke = {
              points: [
                polygonalSelectionStart.x,
                polygonalSelectionStart.y,
                position.x,
                position.y,
              ],
            };

            setPolygonalSelectionStrokes([
              ...polygonalSelectionStrokes,
              stroke,
            ]);

            setPolygonalSelectionAnchor(position);
          } else {
            setAnnotating(true);

            setPolygonalSelectionStart(position);
          }
        }
      }
    }
  };

  const onPolygonalSelectionMouseMove = () => {
    if (annotated) {
      return;
    }

    if (!annotating) {
      return;
    }

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (
          !polygonalSelectionCanClose &&
          !isInside(polygonalSelectionStartingAnchorCircleRef, position)
        ) {
          setPolygonalSelectionCanClose(true);
        }

        if (polygonalSelectionAnchor) {
          const stroke = {
            points: [
              polygonalSelectionAnchor.x,
              polygonalSelectionAnchor.y,
              position.x,
              position.y,
            ],
          };
          polygonalSelectionStrokes.splice(
            polygonalSelectionStrokes.length - 1,
            1,
            stroke
          );

          setPolygonalSelectionStrokes(polygonalSelectionStrokes.concat());
        } else if (polygonalSelectionStart) {
          const stroke = {
            points: [
              polygonalSelectionStart.x,
              polygonalSelectionStart.y,
              position.x,
              position.y,
            ],
          };

          polygonalSelectionStrokes.splice(
            polygonalSelectionStrokes.length - 1,
            1,
            stroke
          );

          setPolygonalSelectionStrokes(polygonalSelectionStrokes.concat());
        }
      }
    }
  };

  const onPolygonalSelectionMouseUp = () => {
    if (annotated) {
      return;
    }

    if (!annotating) {
      return;
    }

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
          if (polygonalSelectionStart) {
            const stroke = {
              points: [
                position.x,
                position.y,
                polygonalSelectionStart.x,
                polygonalSelectionStart.y,
              ],
            };

            setPolygonalSelectionStrokes([
              ...polygonalSelectionStrokes,
              stroke,
            ]);
          }

          const stroke: PolygonalSelectionStroke = {
            points: _.flatten(
              polygonalSelectionStrokes.map(
                (stroke: PolygonalSelectionStroke) => stroke.points
              )
            ),
          };

          setAnnotated(true);

          setAnnotating(false);

          setPolygonalSelectionAnnotation(stroke);

          setPolygonalSelectionStrokes([]);
        } else {
          if (polygonalSelectionStrokes.length === 1) {
            setPolygonalSelectionAnchor(position);

            if (polygonalSelectionStart) {
              const stroke = {
                points: [
                  polygonalSelectionStart!.x,
                  polygonalSelectionStart!.y,
                  position.x,
                  position.y,
                ],
              };

              setPolygonalSelectionStrokes([
                ...polygonalSelectionStrokes,
                stroke,
              ]);
            }
          }
        }
      }
    }
  };

  const PolygonalSelectionAnchor = () => {
    if (
      annotating &&
      polygonalSelectionAnchor &&
      polygonalSelectionStrokes.length > 1
    ) {
      return (
        <ReactKonva.Circle
          fill="#FFF"
          name="anchor"
          radius={3}
          stroke="#FFF"
          strokeWidth={1}
          x={polygonalSelectionAnchor.x}
          y={polygonalSelectionAnchor.y}
        />
      );
    } else {
      return <React.Fragment />;
    }
  };

  const PolygonalSelectionStartingAnchor = () => {
    if (annotating && polygonalSelectionStart) {
      return (
        <ReactKonva.Circle
          fill="#000"
          globalCompositeOperation="source-over"
          hitStrokeWidth={64}
          id="start"
          name="anchor"
          radius={3}
          ref={polygonalSelectionStartingAnchorCircleRef}
          stroke="#FFF"
          strokeWidth={1}
          x={polygonalSelectionStart.x}
          y={polygonalSelectionStart.y}
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
      ref={stageRef}
      width={image.shape?.c}
    >
      <ReactKonva.Layer
        onMouseDown={onPolygonalSelectionMouseDown}
        onMouseMove={onPolygonalSelectionMouseMove}
        onMouseUp={onPolygonalSelectionMouseUp}
      >
        <ReactKonva.Image image={img} />

        <PolygonalSelectionStartingAnchor />

        {!annotated &&
          annotating &&
          polygonalSelectionStrokes.map(
            (stroke: PolygonalSelectionStroke, key: number) => (
              <MarchingAnts
                key={key}
                color="None"
                closed={false}
                stroke={stroke}
              />
            )
          )}

        <PolygonalSelectionAnchor />

        {polygonalSelectionAnnotation && annotated && !annotating && (
          <MarchingAnts
            color={toRGBA(category.color, 0.3)}
            closed={true}
            stroke={polygonalSelectionAnnotation}
          />
        )}

        <ReactKonva.Transformer
          anchorFill="#FFF"
          anchorStroke="#000"
          anchorStrokeWidth={1}
          anchorSize={6}
          borderEnabled={false}
          ref={transformerRef}
          rotateEnabled={false}
        />
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
