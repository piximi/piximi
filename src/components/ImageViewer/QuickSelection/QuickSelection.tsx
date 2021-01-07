import React from "react";
import * as ReactKonva from "react-konva";
import { Image as ImageType } from "../../../types/Image";
import { Stage } from "konva/types/Stage";
import { Image } from "konva/types/shapes/Image";
import useImage from "use-image";
import { Filter } from "konva/types/Node";

type QuickSelectionProps = {
  image: ImageType;
};

const getIdx = (width: number) => {
  return (x: number, y: number, index: number) => {
    index = index || 0;
    return (width * y + x) * 4 + index;
  };
};

const filter: Filter = (imageData: any) => {
  const kernelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];
  const kernelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];
  const width = imageData.width;
  const height = imageData.height;

  const grayscale = [];
  var data = imageData.data;

  const idx = getIdx(width);

  const threshold = 100;

  let x, y;
  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      const r = data[idx(x, y, 0)];
      const g = data[idx(x, y, 1)];
      const b = data[idx(x, y, 2)];

      const mean = (r + g + b) / 3;

      grayscale[idx(x, y, 0)] = mean;
      grayscale[idx(x, y, 1)] = mean;
      grayscale[idx(x, y, 2)] = mean;
    }
  }

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      const responseX =
        kernelX[0][0] * grayscale[idx(x - 1, y - 1, 0)] +
        kernelX[0][1] * grayscale[idx(x + 0, y - 1, 0)] +
        kernelX[0][2] * grayscale[idx(x + 1, y - 1, 0)] +
        kernelX[1][0] * grayscale[idx(x - 1, y + 0, 0)] +
        kernelX[1][1] * grayscale[idx(x + 0, y + 0, 0)] +
        kernelX[1][2] * grayscale[idx(x + 1, y + 0, 0)] +
        kernelX[2][0] * grayscale[idx(x - 1, y + 1, 0)] +
        kernelX[2][1] * grayscale[idx(x + 0, y + 1, 0)] +
        kernelX[2][2] * grayscale[idx(x + 1, y + 1, 0)];

      const responseY =
        kernelY[0][0] * grayscale[idx(x - 1, y - 1, 0)] +
        kernelY[0][1] * grayscale[idx(x + 0, y - 1, 0)] +
        kernelY[0][2] * grayscale[idx(x + 1, y - 1, 0)] +
        kernelY[1][0] * grayscale[idx(x - 1, y + 0, 0)] +
        kernelY[1][1] * grayscale[idx(x + 0, y + 0, 0)] +
        kernelY[1][2] * grayscale[idx(x + 1, y + 0, 0)] +
        kernelY[2][0] * grayscale[idx(x - 1, y + 1, 0)] +
        kernelY[2][1] * grayscale[idx(x + 0, y + 1, 0)] +
        kernelX[2][2] * grayscale[idx(x + 1, y + 1, 0)];

      const magnitude =
        Math.sqrt(responseX * responseX + responseY * responseY) >>> 0;

      data[idx(x, y, 0)] = magnitude > threshold ? 255 : 0;
      data[idx(x, y, 1)] = magnitude > threshold ? 255 : 0;
      data[idx(x, y, 2)] = magnitude > threshold ? 255 : 0;
    }
  }
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
