import React, { useState } from "react";
import * as ReactKonva from "react-konva";
import { Image as ImageType } from "../../../types/Image";
import { Stage } from "konva/types/Stage";
import { Image } from "konva/types/shapes/Image";
import useImage from "use-image";
import { flood } from "../../../image";
import * as ImageJS from "image-js";
import { Vector2d } from "konva/types/types";
import { floodMap, floodPixels } from "../../../image/flood";
import { toRGBA } from "../../../image/toRGBA";
import { Category } from "../../../types/Category";
import { Tooltip } from "@material-ui/core";

type ColorSelectionProps = {
  image: ImageType;
  category: Category;
};

const getIdx = (width: number) => {
  return (x: number, y: number, index: number) => {
    index = index || 0;
    return (width * y + x) * 4 + index;
  };
};

export const ColorSelection = ({ image, category }: ColorSelectionProps) => {
  const [img] = useImage(image.src, "Anonymous");
  const [toleranceMap, setToleranceMap] = useState<ImageJS.Image>();
  const [overlayData, setOverlayData] = useState<string>("");
  const [overlayImage] = useImage(overlayData, "Anonymous");

  const stageRef = React.useRef<Stage>(null);
  const imageRef = React.useRef<Image>(null);
  const overlayRef = React.useRef<Image>(null);

  const [annotated, setAnnotated] = useState<boolean>(false);
  const [mouseHeld, setMouseHeld] = useState<boolean>(false);
  const [initialPosition, setInitialPosition] = useState<Vector2d>();
  const [tolerance, setTolerance] = useState<number>(1);

  const updateOverlay = (position: { x: any; y: any }) => {
    if (toleranceMap) {
      const results = floodPixels({
        x: position.x,
        y: position.y,
        image: toleranceMap,
        tolerance: tolerance,
        color: category.color,
      });
      setOverlayData(results);
    }
  };

  React.useEffect(() => {
    if (imageRef && imageRef.current) {
      imageRef.current.cache();

      imageRef.current.getLayer()?.batchDraw();
    }
  }, [img]);

  const onMouseDown = async () => {
    setTolerance(1);
    setMouseHeld(true);
    if (stageRef && stageRef.current) {
      const position = stageRef.current.getPointerPosition();

      if (position) {
        if (imageRef && imageRef.current) {
          if (position !== initialPosition) {
            setInitialPosition(position);
            const jsImage = await ImageJS.Image.load(
              imageRef.current.toDataURL()
            );
            setToleranceMap(
              floodMap({
                x: position.x,
                y: position.y,
                image: jsImage,
              })
            );
          }
          updateOverlay(position);
        }
      }
    }
  };

  const onMouseMove = async () => {
    if (mouseHeld && stageRef && stageRef.current) {
      const newPosition = stageRef.current.getPointerPosition();
      if (newPosition && initialPosition) {
        const diff = Math.ceil(
          Math.hypot(
            newPosition.x - initialPosition!.x,
            newPosition.y - initialPosition!.y
          )
        );
        if (diff !== tolerance) {
          setTolerance(diff);
          updateOverlay(initialPosition);
        }
      }
    }
  };

  const onMouseUp = () => {
    setMouseHeld(false);
  };

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
        <ReactKonva.Image image={overlayImage} ref={overlayRef} />
        {mouseHeld && initialPosition && (
          <ReactKonva.Label x={initialPosition.x} y={initialPosition.y}>
            <ReactKonva.Tag
              fill={"#f0ce0f"}
              stroke={"#907c09"}
              shadowColor={"black"}
              pointerDirection={"up"}
              pointerWidth={10}
              pointerHeight={10}
              cornerRadius={5}
            />
            <ReactKonva.Text text={tolerance as string} padding={5} />
          </ReactKonva.Label>
        )}
      </ReactKonva.Layer>
    </ReactKonva.Stage>
  );
};
