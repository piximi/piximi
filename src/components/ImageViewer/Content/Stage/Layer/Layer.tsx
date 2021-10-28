import React, { useEffect, useState } from "react";
import * as ReactKonva from "react-konva";
import { useSelector } from "react-redux";
import { scaledImageWidthSelector } from "../../../../../annotator/store/selectors/scaledImageWidthSelector";
import { scaledImageHeightSelector } from "../../../../../annotator/store/selectors/scaledImageHeightSelector";
import {
  stageHeightSelector,
  stageWidthSelector,
  zoomSelectionSelector,
  zoomToolOptionsSelector,
} from "../../../../../annotator/store/selectors";
import { offsetSelector } from "../../../../../annotator/store/selectors/offsetSelector";

type LayerProps = {
  children?: React.ReactNode;
};

export const Layer = ({ children }: LayerProps) => {
  const imageWidth = useSelector(scaledImageWidthSelector);
  const imageHeight = useSelector(scaledImageHeightSelector);

  const offset = useSelector(offsetSelector);

  const { automaticCentering } = useSelector(zoomToolOptionsSelector);

  const zoomSelection = useSelector(zoomSelectionSelector);

  const stageWidth = useSelector(stageWidthSelector);
  const stageHeight = useSelector(stageHeightSelector);

  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!imageWidth || !imageHeight) return;

    if (automaticCentering && !zoomSelection.dragging) {
      setPosition({
        x: (stageWidth - imageWidth) / 2,
        y: (stageHeight - imageHeight) / 2,
      });
    } else {
      setPosition({ x: stageWidth / 2, y: stageHeight / 2 });
    }
  }, [automaticCentering, stageWidth, stageHeight, imageWidth, imageHeight]);

  return (
    <ReactKonva.Layer
      imageSmoothingEnabled={false}
      offset={offset}
      position={position}
    >
      {children}
    </ReactKonva.Layer>
  );
};
