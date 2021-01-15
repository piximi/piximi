import React, { RefObject } from "react";
import { Transformer } from "konva/types/shapes/Transformer";
import { Shape } from "konva/types/Shape";

export const useTransformer = (
  ref: RefObject<Shape>,
  annotated?: boolean,
  annotating?: boolean
) => {
  const transformer = React.useRef<Transformer>(null);

  React.useEffect(() => {
    if (annotated && !annotating) {
      if (ref && ref.current && transformer && transformer.current) {
        transformer.current.nodes([ref.current]);

        const layer = transformer.current.getLayer();

        if (layer) {
          layer.batchDraw();
        }
      }
    }
  }, [annotated, annotating, ref]);

  return transformer;
};
