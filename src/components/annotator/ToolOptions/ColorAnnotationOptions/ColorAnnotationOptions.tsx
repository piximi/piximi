import React from "react";

import { Divider } from "@mui/material";

import { useTranslation } from "hooks";

import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { InvertAnnotation } from "../InvertAnnotation";

export const ColorAnnotationOptions = () => {
  const t = useTranslation();

  return (
    <>
      <InformationBox description="…" name={t("Color annotation")} />

      <Divider />

      <AnnotationMode />

      <Divider />

      <InvertAnnotation />

      {/*<Divider />*/}

      {/*<SampleList />*/}
    </>
  );
};