import Divider from "@mui/material/Divider";
import React from "react";
import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { useTranslation } from "../../../../annotator/hooks/useTranslation";
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
