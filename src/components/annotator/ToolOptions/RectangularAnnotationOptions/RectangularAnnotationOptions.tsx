import React from "react";

import Divider from "@mui/material/Divider";

import { useTranslation } from "hooks/useTranslation";

import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { InvertAnnotation } from "../InvertAnnotation";

export const RectangularAnnotationOptions = () => {
  const t = useTranslation();
  return (
    <>
      <InformationBox
        description="Click and drag to create a rectangular annotation."
        name={t("Rectangular annotation")}
      />

      <Divider />

      <AnnotationMode />

      <Divider />

      <InvertAnnotation />
    </>
  );
};
