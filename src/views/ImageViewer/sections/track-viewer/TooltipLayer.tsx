import React from "react";
import { Label, Layer, Tag, Text } from "react-konva";
import { TooltipProps } from "./types";

export const TooltipLayer = ({
  tooltipProps,
}: {
  tooltipProps: TooltipProps;
}) => {
  return (
    <Layer>
      <Label
        opacity={0.85}
        visible={tooltipProps.visible}
        listening={false}
        x={tooltipProps.x}
        y={tooltipProps.y}
      >
        <Tag
          fill="black"
          pointerDirection="down"
          pointerWidth={10}
          pointerHeight={10}
          lineJoin="round"
        ></Tag>
        <Text
          text={tooltipProps.text}
          fontFamily="Courier New"
          fontSize={30}
          padding={20}
          fill="white"
        />
      </Label>
    </Layer>
  );
};
