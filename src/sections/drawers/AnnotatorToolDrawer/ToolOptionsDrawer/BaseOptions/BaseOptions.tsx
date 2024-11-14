import React from "react";

import { Divider } from "@mui/material";

import { AnnotationModeOptions } from "../AnnotationModeOptions";
import { InvertAnnotation } from "../InvertAnnotation";

export const BaseOptions = ({ children }: { children?: React.ReactNode }) => {
  return (
    <>
      <Divider />

      <AnnotationModeOptions />

      <Divider />

      <InvertAnnotation />
      {children}
    </>
  );
};
