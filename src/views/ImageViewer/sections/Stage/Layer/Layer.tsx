import React from "react";
import { Layer as KonvaLayer } from "react-konva";

type LayerProps = {
  children?: React.ReactNode;
};

export const Layer = ({ children }: LayerProps) => {
  return (
    <>
      <KonvaLayer imageSmoothingEnabled={false}>{children}</KonvaLayer>
    </>
  );
};
