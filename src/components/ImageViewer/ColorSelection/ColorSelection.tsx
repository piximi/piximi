import React, { useState } from "react";
import * as ReactKonva from "react-konva";
import { Image as ImageType } from "../../../types/Image";
import { Stage } from "konva/types/Stage";
import { Image } from "konva/types/shapes/Image";
import useImage from "use-image";
import { flood } from "../../../image";
import * as ImageJS from "image-js";
import { ImageKind } from "image-js";

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
  const [overlayData, setOverlayData] = useState<string>("");
  const [overlayImage] = useImage(overlayData, "Anonymous");

  const stageRef = React.useRef<Stage>(null);
  const imageRef = React.useRef<Image>(null);
  const overlayRef = React.useRef<Image>(null);

  const [annotated, setAnnotated] = useState<boolean>(false);

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
            tolerance: 10,
          });
          setOverlayData(results);
          setAnnotated(true);
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

        {annotated && (
          <ReactKonva.Image image={overlayImage} ref={overlayRef} />
        )}
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
