import React from "react";

import Divider from "@mui/material/Divider";

import { useTranslation } from "hooks/useTranslation";

import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { InvertAnnotation } from "../InvertAnnotation";

export const PolygonalAnnotationOptions = () => {
  const t = useTranslation();

  return (
    <>
      <InformationBox description="…" name={t("Polygonal annotation")} />

      <Divider />

      <AnnotationMode />

      <Divider />

      <InvertAnnotation />
    </>
  );
};
