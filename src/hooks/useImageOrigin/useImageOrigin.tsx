import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import {
  scaledImageHeightSelector,
  scaledImageWidthSelector,
  stageHeightSelector,
  stageWidthSelector,
} from "store/annotator";
import { Point } from "types";

export const useImageOrigin = () => {
  const stageWidth = useSelector(stageWidthSelector);
  const stageHeight = useSelector(stageHeightSelector);
  const imageWidth = useSelector(scaledImageWidthSelector);
  const imageHeight = useSelector(scaledImageHeightSelector);
  const [imagePosition, setImagePosition] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    if (!stageWidth || !imageWidth) return;
    setImagePosition({
      x: (stageWidth - imageWidth) / 2,
      y: (stageHeight - imageHeight!) / 2,
    });
  }, [stageWidth, stageHeight, imageWidth, imageHeight]);

  return imagePosition;
};
