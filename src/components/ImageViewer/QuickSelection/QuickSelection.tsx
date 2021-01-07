import React from "react";
import * as ReactKonva from "react-konva";
import { Image as ImageType } from "../../../types/Image";
import { Stage } from "konva/types/Stage";
import { Image } from "konva/types/shapes/Image";
import useImage from "use-image";
import { Filter } from "konva/types/Node";
import { slic } from "../../../image/slic";

const filter: Filter = (imageData: ImageData) => {
  const segmentation = slic(imageData, {});

  var data = imageData.data;

  data = Uint8ClampedArray.from(segmentation);
};

type QuickSelectionProps = {
  image: ImageType;
};

export const QuickSelection = ({ image }: QuickSelectionProps) => {
  const [img] = useImage(image.src, "Anonymous");

  const stage = React.useRef<Stage>(null);
  const imageRef = React.useRef<Image>(null);

  React.useEffect(() => {
    if (imageRef && imageRef.current) {
      imageRef.current.cache();

      imageRef.current.getLayer()?.batchDraw();
    }
  }, [img]);

  const onMouseDown = () => {};

  const onMouseMove = () => {};

  const onMouseUp = () => {};

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
        <ReactKonva.Image filters={[filter]} image={img} ref={imageRef} />
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
