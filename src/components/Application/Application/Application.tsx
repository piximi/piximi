import CssBaseline from "@material-ui/core/CssBaseline";
import React from "react";
import { ApplicationAppBar, ApplicationDrawer, ImageGrid } from "../index";
import { useDrawer } from "../../../hooks";

export const Application = () => {
  const { open, toggle } = useDrawer();

  return (
    <React.Fragment>
      <CssBaseline />

      <ApplicationAppBar onOpenDrawer={toggle} openDrawer={open} />

      <ApplicationDrawer onCloseDrawer={toggle} openDrawer={open} />

      <ImageGrid openDrawer={open} />
    </React.Fragment>
  );
};
