import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import {
  offsetSelector,
  scaledImageHeightSelector,
  scaledImageWidthSelector,
  stageHeightSelector,
  stageWidthSelector,
  zoomSelectionSelector,
  zoomToolOptionsSelector,
} from "store/selectors";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zoomSelection.dragging not a dependency
  }, [automaticCentering, stageWidth, stageHeight, imageWidth, imageHeight]);

  return (
    <>
      <ReactKonva.Layer
        imageSmoothingEnabled={false}
        offset={offset}
        position={position}
      >
        {children}
      </ReactKonva.Layer>
    </>
  );
};
