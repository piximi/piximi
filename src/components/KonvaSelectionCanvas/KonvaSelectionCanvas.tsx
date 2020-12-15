import React, { useRef, useState } from "react";
import * as Konva from "react-konva";
import { Image } from "../../types/Image";
import { KonvaEventObject } from "konva/types/Node";
import useImage from "use-image";

export enum Method {
  Elliptical,
  Lasso,
  Magnetic,
  Polygonal,
  Quick,
  Rectangular,
}

type AnchorPointProps = {
  x: number;
  y: number;
};

type ImageLayerProps = {
  src: string;
};

type KonvaSelectionCanvasProps = {
  image: Image;
  method: Method;
};

type LassoSelectionLayerProps = {
  strokes: Array<Stroke>;
};

type StartingAnchorPointProps = {
  x: number;
  y: number;
};

type Stroke = {
  method: Method;
  points: Array<number>;
};

const AnchorPoint = ({ x, y }: AnchorPointProps) => {
  return (
    <Konva.Circle
      fill="#FFF"
      name="anchor-point"
      radius={3}
      stroke="#FFF"
      strokeWidth={1}
      x={x}
      y={y}
    />
  );
};

const StartingAnchorPoint = ({ x, y }: StartingAnchorPointProps) => {
  return (
    <Konva.Circle
      fill="#000"
      name="starting-anchor-point"
      radius={3}
      stroke="#FFF"
      strokeWidth={1}
      x={x}
      y={y}
    />
  );
};

const ImageLayer = ({ src }: ImageLayerProps) => {
  const [image] = useImage(src);

  return (
    <Konva.Layer>
      <Konva.Image image={image} />
    </Konva.Layer>
  );
};

const LassoSelectionLayer = ({ strokes }: LassoSelectionLayerProps) => {
  return (
    <Konva.Layer>
      {strokes.map((stroke: Stroke, key: number) => {
        return (
          <React.Fragment>
            <StartingAnchorPoint x={stroke.points[0]} y={stroke.points[1]} />

            <Konva.Line
              dash={[4, 2]}
              globalCompositeOperation="destination-over"
              key={key}
              points={stroke.points}
              stroke="#df4b26"
            />

            <AnchorPoint
              x={stroke.points[stroke.points.length - 2]}
              y={stroke.points[stroke.points.length - 1]}
            />
          </React.Fragment>
        );
      })}
    </Konva.Layer>
  );
};

export const KonvaSelectionCanvas = ({
  image,
  method,
}: KonvaSelectionCanvasProps) => {
  const [anchors, setAnchors] = useState<Array<{ x: number; y: number }>>([]);
  const [strokes, setStrokes] = useState<Array<Stroke>>([]);

  const annotating = useRef<boolean>(false);

  const onLassoMouseDown = (event: KonvaEventObject<MouseEvent>) => {
    annotating.current = true;

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

  const onLassoMouseMove = (event: KonvaEventObject<MouseEvent>) => {
    if (!annotating.current) return;

    const stage = event.target.getStage();

    if (stage) {
      const position = stage.getPointerPosition();

      if (position) {
        let stroke = strokes[strokes.length - 1];

        stroke.points = [...stroke.points, position.x, position.y];

        strokes.splice(strokes.length - 1, 1, stroke);

        setStrokes(strokes.concat());

        const intersection = stage.getIntersection(
          position,
          ".starting-anchor-point"
        );

        if (intersection) {
          console.info("onLassoMouseMove intersection");
        }
      }
    }
  };

  const onLassoMouseUp = (event: KonvaEventObject<MouseEvent>) => {
    if (!annotating.current) return;

    const stage = event.target.getStage();

    if (stage) {
      const position = stage.getPointerPosition();

      if (position) {
        const intersection = stage.getIntersection(
          position,
          ".starting-anchor-point"
        );

        if (intersection) {
          console.info("onLassoMouseUp intersection");
        }
      }
    }

    annotating.current = false;
  };

  const onMouseDown = (event: KonvaEventObject<MouseEvent>) => {
    switch (method) {
      case Method.Lasso:
        onLassoMouseDown(event);
    }
  };

  const onMouseMove = (event: KonvaEventObject<MouseEvent>) => {
    switch (method) {
      case Method.Lasso:
        onLassoMouseMove(event);
    }
  };

  const onMouseUp = (event: KonvaEventObject<MouseEvent>) => {
    switch (method) {
      case Method.Lasso:
        onLassoMouseUp(event);
    }
  };

  return (
    <Konva.Stage
      height={image.shape?.r}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      width={image.shape?.c}
    >
      <ImageLayer src={image.src} />

      {method === Method.Lasso && <LassoSelectionLayer strokes={strokes} />}
    </Konva.Stage>
  );
};
