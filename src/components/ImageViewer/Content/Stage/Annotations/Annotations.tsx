import React from "react";
import { ConfirmedAnnotations } from "./ConfirmedAnnotations";
import { SelectedAnnotations } from "./SelectedAnnotations/SelectedAnnotations";

export const Annotations = () => {
  return (
    <React.Fragment>
      <SelectedAnnotations />
      <ConfirmedAnnotations />
    </React.Fragment>
  );
};
