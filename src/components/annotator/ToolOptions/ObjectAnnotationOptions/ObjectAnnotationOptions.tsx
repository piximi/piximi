import React from "react";

import { Divider } from "@mui/material";

import { useTranslation } from "hooks";

import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";

export const ObjectAnnotationOptions = () => {
  const t = useTranslation();

  return (
    <>
      <InformationBox description="…" name={t("Object annotation")} />

      <Divider />

      <AnnotationMode />

      <Divider />

      {/*<Divider />*/}

      {/*<SampleList />*/}
    </>
  );
};
