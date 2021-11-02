import React from "react";
import { useSelector } from "react-redux";
import { selectedAnnotationsIdsSelector } from "../../../../../store/selectors/selectedAnnotationsIdsSelector";

import { Transformer } from "../Transformer/Transformer";

type TransformersProps = {
  transformPosition: ({
    x,
    y,
  }: {
    x: number;
    y: number;
  }) => { x: number; y: number } | undefined;
};

export const Transformers = ({ transformPosition }: TransformersProps) => {
  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);

  if (!selectedAnnotationsIds) return <></>;

  return (
    <>
      {selectedAnnotationsIds.map((annotationId, idx) => {
        return (
          <>
            {/*// @ts-ignore */}
            <React.Fragment key={annotationId}>
              <Transformer
                transformPosition={transformPosition}
                annotationId={annotationId}
              />
            </React.Fragment>
          </>
        );
      })}
    </>
  );
};
