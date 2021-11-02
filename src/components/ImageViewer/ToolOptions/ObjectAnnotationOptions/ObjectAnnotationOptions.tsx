import Divider from "@mui/material/Divider";
import React from "react";
import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { useTranslation } from "../../../../hooks/useTranslation";

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
