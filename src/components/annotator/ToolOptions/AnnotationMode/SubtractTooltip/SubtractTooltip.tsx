import React from "react";

import { AnnotationModeTooltip } from "../AnnotationModeTooltip";

type SubtractTooltipProps = {
  children: React.ReactElement;
};

export const SubtractTooltip = ({ children }: SubtractTooltipProps) => {
  const content = (
    <p>
      Subtracting an area removes the area you label from an existing
      annotation.
    </p>
  );

  return (
    <AnnotationModeTooltip content={content}>{children}</AnnotationModeTooltip>
  );
};
