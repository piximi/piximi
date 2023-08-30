import React from "react";
import * as ReactKonva from "react-konva";

type LayerProps = {
  children?: React.ReactNode;
};

export const Layer = ({ children }: LayerProps) => {
  return (
    <>
      <ReactKonva.Layer imageSmoothingEnabled={false}>
        {children}
      </ReactKonva.Layer>
    </>
  );
};
