import React, { useCallback, useState } from "react";
import { ApplicationDrawer } from "../ApplicationDrawer";
import { ImageGrid } from "../ImageGrid";
import { ApplicationAppBar } from "../ApplicationAppBar";
import { Box, CssBaseline } from "@mui/material";
import { useStyles } from "./Application.css";
import * as ImageJS from "image-js";
import { Image } from "../../types/Image";
import { v4 } from "uuid";
import { Partition } from "../../types/Partition";
import { createImage } from "../../store/slices";
import { useDispatch } from "react-redux";
import { Shape } from "../../types/Shape";

export const Application = () => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const [, setDropped] = useState<File[]>([]);

  const onDrop = useCallback(
    (item) => {
      if (item) {
        for (let i = 0; i < item.files.length; i++) {
          const file = item.files[i];

          file.arrayBuffer().then((buffer: any) => {
            ImageJS.Image.load(buffer).then((image) => {
              //check whether name already exists
              const shape: Shape = {
                channels: image.components,
                frames: 1,
                height: image.height,
                planes: 1,
                width: image.width,
              };

              const imageDataURL = image.toDataURL("image/png", {
                useCanvas: true,
              });

              const loaded: Image = {
                categoryId: "00000000-0000-0000-0000-000000000000",
                id: v4(),
                annotations: [],
                name: file.name,
                partition: Partition.Inference,
                shape: shape,
                originalSrc: imageDataURL,
                src: imageDataURL,
              };

              dispatch(createImage({ image: loaded }));
            });
          });
        }
      }
    },
    [dispatch, setDropped]
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
