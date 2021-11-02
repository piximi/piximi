import React from "react";
import { AnnotationModeTooltip } from "../AnnotationModeTooltip";

type IntersectionTooltipProps = {
  children: React.ReactElement;
};

export const IntersectionTooltip = ({ children }: IntersectionTooltipProps) => {
  return (
    <AnnotationModeTooltip
      content={
        <p>
          Constrain the boundary of the new annotation to the selected
          annotation.
        </p>
      }
    >
      {children}
    </AnnotationModeTooltip>
  );
};
