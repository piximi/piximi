import React from "react";

import { Divider } from "@mui/material";

import { AnnotationMode } from "../AnnotationMode";
import { InvertAnnotation } from "../InvertAnnotation";

export const BaseOptions = ({ children }: { children?: React.ReactNode }) => {
  return (
    <>
      <Divider />

      <AnnotationMode />

      <Divider />

      <InvertAnnotation />
    </>
  );
};
