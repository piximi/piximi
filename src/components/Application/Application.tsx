import React, { useCallback } from "react";
import { ApplicationDrawer } from "../ApplicationDrawer";
import { ImageGrid } from "../ImageGrid";
import { ApplicationAppBar } from "../ApplicationAppBar";
import { Box, CssBaseline } from "@mui/material";
import { useStyles } from "./Application.css";
import { createImage } from "../../store/slices";
import { useDispatch } from "react-redux";
import { convertFileToImages } from "../../image/imageHelper";

export const Application = () => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const onDrop = useCallback(
    async (item) => {
      if (item) {
        for (let i = 0; i < item.files.length; i++) {
          const file = item.files[i];

          const images = await convertFileToImages(file);

          //if length of images is > 1, then the user selected a z-stack --> only show center image
          dispatch(
            createImage({ image: images[Math.floor(images.length / 2)] })
          );
        }
      }
    },
    [dispatch]
  );

  return (
    <Box className={classes.body}>
      <CssBaseline />

      <ApplicationAppBar />

      <ApplicationDrawer />

      <ImageGrid onDrop={onDrop} />
    </Box>
  );
};
