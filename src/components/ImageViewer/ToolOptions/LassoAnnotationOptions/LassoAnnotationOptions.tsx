import Divider from "@mui/material/Divider";
import React from "react";
import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { InvertAnnotation } from "../InvertAnnotation";
import { useTranslation } from "../../../../annotator/hooks/useTranslation";

export const LassoAnnotationOptions = () => {
  const t = useTranslation();

  return (
    <>
      <InformationBox description="…" name={t("Lasso annotation")} />

      <Divider />

      <AnnotationMode />

      <Divider />

      <InvertAnnotation />
    </>
  );
};
