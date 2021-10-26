import React from "react";
import { ApplicationDrawer } from "../ApplicationDrawer";
import { ImageGrid } from "../ImageGrid";
import { ApplicationAppBar } from "../ApplicationAppBar";
import { Box, CssBaseline } from "@mui/material";
import { useStyles } from "./Application.css";

export const Application = () => {
  const classes = useStyles();
  return (
    <Box className={classes.body}>
      <CssBaseline />

      <ApplicationAppBar />

      <ApplicationDrawer />

      <ImageGrid />
    </Box>
  );
};
