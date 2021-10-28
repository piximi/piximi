import React from "react";
import { AnnotationModeTooltip } from "../AnnotationModeTooltip";

type NewTooltipProps = {
  children: React.ReactElement;
};

export const NewTooltip = ({ children }: NewTooltipProps) => {
  return (
    <AnnotationModeTooltip content={<p>Create a new annotation.</p>}>
      {children}
    </AnnotationModeTooltip>
  );
};
