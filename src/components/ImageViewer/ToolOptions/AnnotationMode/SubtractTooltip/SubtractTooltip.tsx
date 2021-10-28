import React from "react";
import { AnnotationModeTooltip } from "../AnnotationModeTooltip";

type SubtractTooltipProps = {
  children: React.ReactElement;
};

export const SubtractTooltip = ({ children }: SubtractTooltipProps) => {
  const content = (
    <React.Fragment>
      <p>
        Subtracting an area removes the area you label from an existing
        annotation.
      </p>
    </React.Fragment>
  );

  return (
    <AnnotationModeTooltip content={content}>{children}</AnnotationModeTooltip>
  );
};
