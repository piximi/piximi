import React from "react";

import { ConfirmedAnnotations } from "./ConfirmedAnnotations";
import { SelectedAnnotations } from "./SelectedAnnotations";

export const Annotations = () => {
  return (
    <>
      <SelectedAnnotations />
      <ConfirmedAnnotations />
    </>
  );
};
