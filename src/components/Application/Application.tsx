import CssBaseline from "@material-ui/core/CssBaseline";
import React from "react";
import { useDrawer } from "../../hooks";
import { ApplicationDrawer } from "../ApplicationDrawer";
import { ImageGrid } from "../ImageGrid";
import { ApplicationAppBar } from "../ApplicationAppBar";

export const Application = () => {
  const { open, toggle } = useDrawer();

  return (
    <React.Fragment>
      <CssBaseline />

      <ApplicationAppBar toggle={toggle} open={open} />

      <ApplicationDrawer onCloseDrawer={toggle} openDrawer={open} />

      <ImageGrid openDrawer={open} />
    </React.Fragment>
  );
};
