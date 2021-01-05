import React, { useEffect, useState } from "react";
import { Image } from "../../../types/Image";
import * as ReactKonva from "react-konva";
import useImage from "use-image";
import { Stage } from "konva/types/Stage";

type ImageViewerProps = {
  data: Image;
};

export const EllipticalSelection = ({ data }: ImageViewerProps) => {
  const [image] = useImage(data.src);

  const stage = React.useRef<Stage>(null);

  const [x, setX] = React.useState<number>(0);
  const [y, setY] = React.useState<number>(0);
  const [radiusX, setRadiusX] = React.useState<number>(50);
  const [radiusY, setRadiusY] = React.useState<number>(50);

  const onMouseDown = () => {};

  const onMouseMove = () => {};

  const onMouseUp = () => {};

  return (
    <ReactKonva.Stage
      globalCompositeOperation="destination-over"
      height={data.shape?.r}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      ref={stage}
      width={data.shape?.c}
    >
      <ReactKonva.Layer>
        <ReactKonva.Image image={image} />
        <ReactKonva.Ellipse
          x={x}
          y={y}
          radiusX={radiusX}
          radiusY={radiusY}
          stroke="white"
        />
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
