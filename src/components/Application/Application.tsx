import CssBaseline from "@material-ui/core/CssBaseline";
import React from "react";
import { ApplicationDrawer } from "../ApplicationDrawer";
import { ImageGrid } from "../ImageGrid";
import { ApplicationAppBar } from "../ApplicationAppBar";

export const Application = () => {
  return (
    <React.Fragment>
      <CssBaseline />

      <ApplicationAppBar />

      <ApplicationDrawer />

      <ImageGrid />
    </React.Fragment>
  );
};
