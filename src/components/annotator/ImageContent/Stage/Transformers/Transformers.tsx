import React from "react";
import { useSelector } from "react-redux";

import { Transformer } from "./Transformer/Transformer";

import { selectedAnnotationsIdsSelector } from "store/image-viewer";

import { AnnotationTool } from "annotator/AnnotationTools";

type TransformersProps = {
  transformPosition: ({
    x,
    y,
  }: {
    x: number;
    y: number;
  }) => { x: number; y: number } | undefined;
  annotationTool?: AnnotationTool;
};

export const Transformers = ({
  transformPosition,
  annotationTool,
}: TransformersProps) => {
  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);

  if (!selectedAnnotationsIds) return <></>;

  return (
    <>
      {selectedAnnotationsIds.map((annotationId, idx) => {
        return (
          <Transformer
            transformPosition={transformPosition}
            annotationId={annotationId}
            annotationTool={annotationTool}
            key={idx}
          />
        );
      })}
    </>
  );
};
