import React from "react";
import { Layer, Label, Tag, Text } from "react-konva";

interface TooltipLayerProps {
  visible: boolean;
  x: number;
  y: number;
  text: string;
}

/**
 * A Konva layer that displays a tooltip above annotations.
 * Shows a shortened annotation ID when hovering over annotation shapes.
 */
export const TooltipLayer: React.FC<TooltipLayerProps> = ({
  visible,
  x,
  y,
  text,
}) => {
  return (
    <Layer>
      <Label opacity={0.85} visible={visible} listening={false} x={x} y={y}>
        <Tag
          fill="black"
          pointerDirection="down"
          pointerWidth={10}
          pointerHeight={10}
          lineJoin="round"
        />
        <Text
          text={text}
          fontFamily="Courier New"
          fontSize={30}
          padding={20}
          fill="white"
        />
      </Label>
    </Layer>
  );
};
