import React from "react";
import { AnnotationModeTooltip } from "../AnnotationModeTooltip";

type AddTooltipProps = {
  children: React.ReactElement;
};

export const AddTooltip = ({ children }: AddTooltipProps) => {
  const content = (
    <>
      <p>
        Adding to an annotation adds any new areas you annotate to an existing
        annotation.
      </p>
    </>
  );

  return (
    <AnnotationModeTooltip content={content}>{children}</AnnotationModeTooltip>
  );
};
