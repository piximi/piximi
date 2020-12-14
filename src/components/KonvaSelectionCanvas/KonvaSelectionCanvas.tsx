import React, { useEffect, useRef, useState } from "react";
import * as Konva from "react-konva";
import { Image } from "../../types/Image";
import { KonvaEventObject } from "konva/types/Node";
import useImage from "use-image";

export enum Method {
  Lasso,
  Bar,
}

type KonvaSelectionCanvasProps = {
  image: Image;
  method: Method;
};

type Stroke = {
  method: Method;
  points: Array<number>;
};

export const KonvaSelectionCanvas = ({
  image,
  method,
}: KonvaSelectionCanvasProps) => {
  const [strokes, setStrokes] = useState<Array<Stroke>>([]);
  const [dashOffset, setDashOffset] = useState<number>(0);

  const [img] = useImage(image?.src);

  const selecting = useRef<boolean>(false);

  const onMouseDown = (event: KonvaEventObject<MouseEvent>) => {
    selecting.current = true;

    const stage = event.target.getStage();

    if (stage) {
      const position = stage.getPointerPosition();

      if (position) {
        const stroke: Stroke = {
          method: method,
          points: [position.x, position.y],
        };

        setStrokes([...strokes, stroke]);
      }
    }
  };

  const onMouseMove = (event: KonvaEventObject<MouseEvent>) => {
    // no drawing - skipping
    if (!selecting.current) {
      return;
    }

    if (method === Method.Lasso) {
      const stage = event.target.getStage();

      if (stage) {
        const position = stage.getPointerPosition();

        if (position) {
          let stroke = strokes[strokes.length - 1];

          stroke.points = [...stroke.points, position.x, position.y];

          strokes.splice(strokes.length - 1, 1, stroke);

          setStrokes(strokes.concat());
        }
      }
    }
  };

  const onMouseUp = () => {
    selecting.current = false;
  };

  useEffect(() => {
    setTimeout(() => {
      setDashOffset(dashOffset + 1);

      if (dashOffset > 16) {
        setDashOffset(0);
      }
    }, 120);
  });

  return (
    <Konva.Stage
      height={image.shape?.r}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      width={image.shape?.c}
    >
      <Konva.Layer>
        <Konva.Image image={img} />
      </Konva.Layer>

      <Konva.Layer>
        {strokes.map((stroke: Stroke, key: number) => {
          return (
            <Konva.Line
              dash={[4, 2]}
              dashOffset={dashOffset}
              key={key}
              points={stroke.points}
              stroke="#df4b26"
            />
          );
        })}
      </Konva.Layer>
    </Konva.Stage>
  );
};
