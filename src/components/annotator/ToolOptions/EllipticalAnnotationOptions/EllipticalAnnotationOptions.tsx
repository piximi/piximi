import React from "react";

import { Divider } from "@mui/material";

import { useTranslation } from "hooks";

import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { InvertAnnotation } from "../InvertAnnotation";

export const EllipticalAnnotationOptions = () => {
  const t = useTranslation();
  return (
    <>
      <InformationBox
        description="Click and drag to create an elliptical annotation."
        name={t("Elliptical annotation")}
      />

      <Divider />

      <AnnotationMode />

      <Divider />

      <InvertAnnotation />
    </>
  );
};
