import Divider from "@mui/material/Divider";
import React from "react";
import { SampleList } from "../SampleList";
import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { useTranslation } from "../../../../annotator/hooks/useTranslation";

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
