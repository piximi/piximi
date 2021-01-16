import React, { useState } from "react";
import * as ReactKonva from "react-konva";
import { Image } from "../../../types/Image";
import useImage from "use-image";
import { Stage } from "konva/types/Stage";
import { Circle } from "konva/types/shapes/Circle";
import { Transformer } from "konva/types/shapes/Transformer";
import { Group } from "konva/types/Group";
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

type KonvaLassoSelectionCanvasProps = {
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

export const LassoSelection = ({
  image,
  category,
}: KonvaLassoSelectionCanvasProps) => {
  const [img] = useImage(image.src);

  const stageRef = React.useRef<Stage>(null);
  const lassoSelectionStartingAnchorCircleRef = React.useRef<Circle>(null);
  const transformerRef = React.useRef<Transformer>(null);
  const lassoSelectionRef = React.useRef<Line>(null);

  const [lassoSelectionAnchor, setLassoSelectionAnchor] = useState<Anchor>();
  const [annotated, setLassoSelectionAnnotated] = useState<boolean>(false);
  const [annotating, setLassoSelectionAnnotating] = useState<boolean>(false);
  const [
    lassoSelectionAnnotation,
    setLassoSelectionAnnotation,
  ] = useState<Stroke>();
  const [lassoSelectionStart, setLassoSelectionStart] = useState<Anchor>();
  const [lassoSelectionStrokes, setLassoSelectionStrokes] = useState<
    Array<Stroke>
  >([]);
  const [
    lassoSelectionEarlyRelease,
    setLassoSelectionEarlyRelease,
  ] = useState<boolean>(false);
  const [lassoSelectionCanClose, setLassoSelectionCanClose] = useState<boolean>(
    false
  );

  React.useEffect(() => {
    if (
      annotated &&
      lassoSelectionRef &&
      lassoSelectionRef.current &&
      transformerRef &&
      transformerRef.current
    ) {
      transformerRef.current.nodes([lassoSelectionRef.current]);

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
    const inside = isInside(lassoSelectionStartingAnchorCircleRef, position);
    if (lassoSelectionStrokes && lassoSelectionStrokes.length > 0) {
      return inside && lassoSelectionCanClose;
    }
  };

  const onLassoSelectionMouseDown = () => {
    if (annotated) return;

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
          const stroke: Stroke = {
            method: Method.Lasso,
            points: _.flatten(
              lassoSelectionStrokes.map((stroke: Stroke) => stroke.points)
            ),
          };

          setLassoSelectionAnnotated(true);
          setLassoSelectionAnnotating(false);
          setLassoSelectionAnnotation(stroke);
          setLassoSelectionStrokes([]);
        } else {
          if (!lassoSelectionEarlyRelease) {
            if (lassoSelectionAnchor) {
              const stroke = {
                method: Method.Lasso,
                points: [
                  lassoSelectionAnchor.x,
                  lassoSelectionAnchor.y,
                  position.x,
                  position.y,
                ],
              };

              setLassoSelectionStrokes([...lassoSelectionStrokes, stroke]);

              setLassoSelectionAnchor(position);
            } else {
              setLassoSelectionAnnotating(true);

              setLassoSelectionStart(position);

              const stroke: Stroke = {
                method: Method.Lasso,
                points: [position.x, position.y],
              };

              setLassoSelectionStrokes([...lassoSelectionStrokes, stroke]);
            }
          } else {
            setLassoSelectionEarlyRelease(false);
          }
        }
      }
    }
  };

  const onLassoSelectionMouseMove = () => {
    if (annotated) return;

    if (!annotating) return;

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (
          !lassoSelectionCanClose &&
          !isInside(lassoSelectionStartingAnchorCircleRef, position)
        ) {
          setLassoSelectionCanClose(true);
        }

        if (lassoSelectionAnchor && !lassoSelectionEarlyRelease) {
          const stroke = {
            method: Method.Lasso,
            points: [
              lassoSelectionAnchor.x,
              lassoSelectionAnchor.y,
              position.x,
              position.y,
            ],
          };

          if (lassoSelectionStrokes.length > 2) {
            lassoSelectionStrokes.splice(
              lassoSelectionStrokes.length - 1,
              1,
              stroke
            );

            setLassoSelectionStrokes(lassoSelectionStrokes.concat());
          } else {
            setLassoSelectionStrokes([...lassoSelectionStrokes, stroke]);
          }
        } else {
          let stroke = lassoSelectionStrokes[lassoSelectionStrokes.length - 1];

          stroke.points = [...stroke.points, position.x, position.y];

          lassoSelectionStrokes.splice(
            lassoSelectionStrokes.length - 1,
            1,
            stroke
          );

          setLassoSelectionStrokes(lassoSelectionStrokes.concat());

          if (connected(position)) {
            //  TODO:
          } else {
            //  TODO:
          }
        }
      }
    }
  };

  const onLassoSelectionMouseUp = () => {
    if (annotated) return;

    if (!annotating) return;

    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
          if (lassoSelectionStart) {
            const stroke = {
              method: Method.Lasso,
              points: [
                position.x,
                position.y,
                lassoSelectionStart.x,
                lassoSelectionStart.y,
              ],
            };

            setLassoSelectionStrokes([...lassoSelectionStrokes, stroke]);
          }

          const stroke: Stroke = {
            method: Method.Lasso,
            points: _.flatten(
              lassoSelectionStrokes.map((stroke: Stroke) => stroke.points)
            ),
          };

          setLassoSelectionAnnotated(true);
          setLassoSelectionAnnotating(false);
          setLassoSelectionAnnotation(stroke);
          setLassoSelectionStrokes([]);
        } else {
          if (
            !lassoSelectionAnchor &&
            lassoSelectionStrokes[lassoSelectionStrokes.length - 1].points
              .length <= 2
          ) {
            setLassoSelectionEarlyRelease(true);
          }
          setLassoSelectionAnchor(position);
        }
      }
    }
  };

  const LassoSelectionAnchor = () => {
    if (
      annotating &&
      lassoSelectionAnchor &&
      lassoSelectionStrokes.length > 1
    ) {
      return (
        <ReactKonva.Circle
          fill="#FFF"
          name="anchor"
          radius={3}
          stroke="#FFF"
          strokeWidth={1}
          x={lassoSelectionAnchor.x}
          y={lassoSelectionAnchor.y}
        />
      );
    } else {
      return <React.Fragment />;
    }
  };

  const LassoSelectionStartingAnchor = () => {
    if (annotating && lassoSelectionStart) {
      return (
        <ReactKonva.Circle
          fill="#000"
          globalCompositeOperation="source-over"
          hitStrokeWidth={64}
          id="start"
          name="anchor"
          radius={3}
          ref={lassoSelectionStartingAnchorCircleRef}
          stroke="#FFF"
          strokeWidth={1}
          x={lassoSelectionStart.x}
          y={lassoSelectionStart.y}
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
        onMouseDown={onLassoSelectionMouseDown}
        onMouseMove={onLassoSelectionMouseMove}
        onMouseUp={onLassoSelectionMouseUp}
      >
        <ReactKonva.Image image={img} />

        <LassoSelectionStartingAnchor />

        {!annotated &&
          annotating &&
          lassoSelectionStrokes.map((stroke: Stroke, key: number) => (
            <MarchingAnts
              key={key}
              color="None"
              closed={false}
              stroke={stroke}
            />
          ))}

        <LassoSelectionAnchor />

        {lassoSelectionAnnotation && annotated && !annotating && (
          <MarchingAnts
            color={toRGBA(category.color, 0.3)}
            closed={true}
            stroke={lassoSelectionAnnotation}
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
