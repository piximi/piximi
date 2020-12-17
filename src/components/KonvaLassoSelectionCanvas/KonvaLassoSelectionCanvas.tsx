import React, {useEffect, useRef, useState} from "react";
import * as ReactKonva from "react-konva";
import {Image} from "../../types/Image";
import {KonvaEventObject} from "konva/types/Node";
import useImage from "use-image";
import {Stage} from "konva/types/Stage";
import {Circle} from "konva/types/shapes/Circle";
import * as Konva from "konva";

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

export const KonvaLassoSelectionCanvas = ({image}: KonvaLassoSelectionCanvasProps) => {
  const [img] = useImage(image.src);

  const stage = React.useRef<Stage>(null);
  const startingAnchorCircle = React.useRef<Circle>(null);

  const [annotating, setAnnotating] = useState<boolean>(false);
  const [annotated, setAnnotated] = useState<boolean>(false);
  const [anchor, setAnchor] = useState<Anchor>();
  const [start, setStart] = useState<Anchor>();
  const [strokes, setStrokes] = useState<Array<Stroke>>([]);

  const connected = (position: { x: number, y: number }) => {
    if (startingAnchorCircle && startingAnchorCircle.current) {
      const rectangle = startingAnchorCircle.current.getClientRect();

      const inside = (
        (rectangle.x <= position.x && position.x <= rectangle.x + rectangle.width) &&
        (rectangle.y <= position.y && position.y <= rectangle.y + rectangle.height)
      );

      if (strokes && strokes.length > 0) {
        return inside && strokes[0].points.length > 32;
      }
    }
  }

  const onMouseDown = () => {
    if (annotated) return;

    if (stage && stage.current) {
      const position = stage.current.getPointerPosition();

      if (position) {
        if (connected(position)) {
          setAnnotating(false);

          setAnnotated(true);
        } else {
          if (anchor) {
            const stroke = {
              method: Method.Lasso,
              points: [anchor.x, anchor.y, position.x, position.y]
            }

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
            points: [anchor.x, anchor.y, position.x, position.y]
          }

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
            console.info("connected");
          } else {

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
              points: [position.x, position.y, start.x, start.y]
            }

            setStrokes([...strokes, stroke]);
          }

          setAnnotating(false);

          setAnnotated(true);
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
      return <React.Fragment/>
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
      return <React.Fragment/>
    }
  }

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

        {strokes.map((stroke: Stroke, key: number) => {
          return (
            <ReactKonva.Line
              dash={[4, 2]}
              fillEnabled={false}
              key={key}
              points={stroke.points}
              stroke="#df4b26"
            />
          );
        })}

        <Anchor/>
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
