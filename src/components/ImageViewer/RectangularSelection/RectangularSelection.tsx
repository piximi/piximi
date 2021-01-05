import React from "react";
import { Image } from "../../../types/Image";
import * as ReactKonva from "react-konva";
import useImage from "use-image";
import { Stage } from "konva/types/Stage";

type ImageViewerProps = {
  data: Image;
};

export const RectangularSelection = ({ data }: ImageViewerProps) => {
  const [img] = useImage(data.src);

  const stage = React.useRef<Stage>(null);

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
        <ReactKonva.Image image={img} />
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
