import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { imageOriginSelector } from "store/imageViewer";

type PointerSelectionProps = {
  dragging: boolean;
  minimum:
    | {
        x: number;
        y: number;
      }
    | undefined;
  maximum:
    | {
        x: number;
        y: number;
      }
    | undefined;
  selecting: boolean;
};

export const PointerSelection = ({
  dragging,
  minimum,
  maximum,
  selecting,
}: PointerSelectionProps) => {
  const imagePosition = useSelector(imageOriginSelector);

  if (!minimum || !maximum || !selecting || !dragging) return <></>;

  return (
    <>
      <ReactKonva.Rect
        dash={[4, 2]}
        height={maximum.y - minimum.y}
        stroke="white"
        strokeWidth={1}
        width={maximum.x - minimum.x}
        x={minimum.x + imagePosition.x}
        y={minimum.y + imagePosition.y}
      />
    </>
  );
};
