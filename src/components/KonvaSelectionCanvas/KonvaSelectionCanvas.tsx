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

type Anchor = {
  x: number;
  y: number;
};

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
  end?: Anchor;
  start?: Anchor;
  strokes: Array<Stroke>;
};

type PolygonalSelectionLayerProps = {
  current?: Anchor;
  end?: Anchor;
  start?: Anchor;
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

const LassoSelectionLayer = ({
  end,
  start,
  strokes,
}: LassoSelectionLayerProps) => {
  return (
    <Konva.Layer>
      {strokes.map((stroke: Stroke, key: number) => {
        return (
          <React.Fragment>
            {start && <StartingAnchorPoint x={start.x} y={start.y} />}

            <Konva.Line
              dash={[4, 2]}
              globalCompositeOperation="destination-over"
              key={key}
              points={stroke.points}
              stroke="#df4b26"
            />

            {end && <AnchorPoint x={end.x} y={end.y} />}
          </React.Fragment>
        );
      })}
    </Konva.Layer>
  );
};

const PolygonalSelectionLayer = ({
  current,
  end,
  start,
}: PolygonalSelectionLayerProps) => {
  return (
    <Konva.Layer>
      <React.Fragment>
        {start && <StartingAnchorPoint x={start.x} y={start.y} />}

        {start && current && (
          <Konva.Line
            dash={[4, 2]}
            globalCompositeOperation="destination-over"
            points={[start.x, start.y, current.x, current.y]}
            stroke="#df4b26"
          />
        )}

        {/*{end && <AnchorPoint x={end.x} y={end.y} />}*/}
      </React.Fragment>
    </Konva.Layer>
  );
};

export const KonvaSelectionCanvas = ({
  image,
  method,
}: KonvaSelectionCanvasProps) => {
  const [current, setCurrent] = useState<Anchor>();
  const [start, setStart] = useState<Anchor>();
  const [end, setEnd] = useState<Anchor>();

  const [strokes, setStrokes] = useState<Array<Stroke>>([]);

  const annotating = useRef<boolean>(false);

  const onLassoMouseDown = (event: KonvaEventObject<MouseEvent>) => {
    annotating.current = true;

    const stage = event.target.getStage();

    if (stage) {
      const position = stage.getPointerPosition();

      if (position) {
        setStart({ x: position.x, y: position.y });

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
        setEnd({ x: position.x, y: position.y });
      }
    }

    annotating.current = false;
  };

  const onPolygonalMouseDown = (event: KonvaEventObject<MouseEvent>) => {
    annotating.current = true;

    const stage = event.target.getStage();

    if (stage) {
      const position = stage.getPointerPosition();

      if (position) {
        setStart(position);
      }
    }
  };

  const onPolygonalMouseMove = (event: KonvaEventObject<MouseEvent>) => {
    if (!annotating.current) return;

    const stage = event.target.getStage();

    if (stage) {
      const position = stage.getPointerPosition();

      if (position) {
        setCurrent(position);
      }
    }
  };

  const onPolygonalMouseUp = (event: KonvaEventObject<MouseEvent>) => {
    if (!annotating.current) return;

    const stage = event.target.getStage();

    if (stage) {
      const position = stage.getPointerPosition();

      if (position) {
        setEnd(position);
      }
    }
  };

  const onMouseDown = (event: KonvaEventObject<MouseEvent>) => {
    switch (method) {
      case Method.Lasso:
        onLassoMouseDown(event);

        break;
      case Method.Polygonal:
        onPolygonalMouseDown(event);

        break;
    }
  };

  const onMouseMove = (event: KonvaEventObject<MouseEvent>) => {
    switch (method) {
      case Method.Lasso:
        onLassoMouseMove(event);

        break;
      case Method.Polygonal:
        onPolygonalMouseMove(event);

        break;
    }
  };

  const onMouseUp = (event: KonvaEventObject<MouseEvent>) => {
    switch (method) {
      case Method.Lasso:
        onLassoMouseUp(event);

        break;
      case Method.Polygonal:
        onPolygonalMouseUp(event);

        break;
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

      {method === Method.Lasso && (
        <LassoSelectionLayer end={end} start={start} strokes={strokes} />
      )}
      {method === Method.Polygonal && (
        <PolygonalSelectionLayer current={current} end={end} start={start} />
      )}
    </Konva.Stage>
  );
};
