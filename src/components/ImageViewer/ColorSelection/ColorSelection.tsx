import React from "react";
import * as ReactKonva from "react-konva";
import { Image as ImageType } from "../../../types/Image";
import { Stage } from "konva/types/Stage";
import { Image } from "konva/types/shapes/Image";
import useImage from "use-image";
import { Filter } from "konva/types/Node";
import { flood } from "../../../image";
import * as ImageJS from "image-js";

type ColorSelectionProps = {
  image: ImageType;
};

const getIdx = (width: number) => {
  return (x: number, y: number, index: number) => {
    index = index || 0;
    return (width * y + x) * 4 + index;
  };
};

export const ColorSelection = ({ image }: ColorSelectionProps) => {
  const [img] = useImage(image.src, "Anonymous");

  const stageRef = React.useRef<Stage>(null);
  const imageRef = React.useRef<Image>(null);

  React.useEffect(() => {
    if (imageRef && imageRef.current) {
      imageRef.current.cache();

      imageRef.current.getLayer()?.batchDraw();
    }
  }, [img]);

  const onMouseDown = async () => {
    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (imageRef && imageRef.current) {
          const jsImage = await ImageJS.Image.load(
            imageRef.current.toDataURL()
          );
          const results = flood({
            x: position.x,
            y: position.y,
            image: jsImage,
            tolerance: 100,
          });
          console.log(position, results);
        }
      }
    }
  };

  const onMouseMove = () => {};

  const onMouseUp = () => {};

  return (
    <ReactKonva.Stage
      globalCompositeOperation="destination-over"
      height={image.shape?.r}
      ref={stageRef}
      width={image.shape?.c}
    >
      <ReactKonva.Layer
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        <ReactKonva.Image image={img} ref={imageRef} />
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
