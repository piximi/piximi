import React from "react";
import * as ReactKonva from "react-konva";
import { Image as ImageType } from "../../../types/Image";
import { Stage } from "konva/types/Stage";
import { Image } from "konva/types/shapes/Image";
import useImage from "use-image";
import { Filter } from "konva/types/Node";
import { slic } from "../../../image";
import { Category } from "../../../types/Category";

type Superpixels = {
  [pixel: number]: {
    count: number;
    mask: {
      background: number;
      foreground: number;
    };
    mp: [number, number, number];
    role: {
      background: boolean;
      background_and_foreground: boolean;
      foreground: boolean;
      unknown: boolean;
    };
  };
};

const filter: Filter = (imageData: ImageData) => {
  const { data } = imageData;

  const { image, segmentation } = slic(imageData, 32);

  let superpixels: Superpixels = {};

  for (let index = 0; index < segmentation.length; index += 1) {
    const current = segmentation[index];

    if (!superpixels.hasOwnProperty(current)) {
      superpixels[current] = {
        count: 0,
        mask: {
          background: 0,
          foreground: 0,
        },
        mp: [0, 0, 0],
        role: {
          background: false,
          background_and_foreground: false,
          foreground: false,
          unknown: false,
        },
      };
    }

    superpixels[current].count += 1;
    superpixels[current].mp[0] += image[4 * index];
    superpixels[current].mp[1] += image[4 * index + 1];
    superpixels[current].mp[2] += image[4 * index + 2];
  }

  for (const superpixel in superpixels) {
    superpixels[superpixel].mp[0] /= superpixels[superpixel].count;
    superpixels[superpixel].mp[1] /= superpixels[superpixel].count;
    superpixels[superpixel].mp[2] /= superpixels[superpixel].count;
  }

  Object.values(superpixels).forEach((superpixel) => {
    if (superpixel.mask.foreground > 0 && superpixel.mask.background === 0) {
      superpixel.role.foreground = true;
    } else if (
      superpixel.mask.foreground === 0 &&
      superpixel.mask.background > 0
    ) {
      superpixel.role.background = true;
    } else if (
      superpixel.mask.foreground > 0 &&
      superpixel.mask.background > 0
    ) {
      superpixel.role.background_and_foreground = true;
    } else {
      superpixel.role.unknown = true;
    }
  });

  for (let index = 0; index < segmentation.length; index += 1) {
    if (superpixels[segmentation[index]].role.foreground) {
      data[4 * index] = image[4 * index];
      data[4 * index + 1] = image[4 * index + 1];
      data[4 * index + 2] = image[4 * index + 2];
      data[4 * index + 3] = 255;
    } else {
      data[4 * index + 3] = 0;
    }
  }

  let superpixel;
  for (let index = 0; index < segmentation.length; ++index) {
    superpixel = superpixels[segmentation[index]];
    data[4 * index + 3] = 255;
    if (segmentation[index] === segmentation[index + 1]) {
      data[4 * index] = superpixel.mp[0];
      data[4 * index + 1] = superpixel.mp[1];
      data[4 * index + 2] = superpixel.mp[2];
    } else {
      data[4 * index] = 0;
      data[4 * index + 1] = 0;
      data[4 * index + 2] = 0;
    }
  }
};

type QuickSelectionProps = {
  image: ImageType;
  category: Category;
};

export const QuickSelection = ({ image, category }: QuickSelectionProps) => {
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
