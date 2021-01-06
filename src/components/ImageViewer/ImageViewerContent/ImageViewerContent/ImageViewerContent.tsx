import React, { useEffect, useRef } from "react";
import { Image } from "../../../../types/Image";
import * as Konva from "react-konva";
import useImage from "use-image";
import { useStyles } from "./ImageViewerContent.css";
import Box from "@material-ui/core/Box";

type ImageViewerProps = {
  data: Image;
};

export const ImageViewerContent = ({ data }: ImageViewerProps) => {
  const [image] = useImage(data?.src);

  const classes = useStyles();

  return (
    <main className={classes.content}>
      <div className={classes.toolbar} />

      <Box alignItems="center" display="flex" justifyContent="center">
        <Konva.Stage height={data.shape?.r} width={data.shape?.c}>
          <Konva.Layer>
            <Konva.Image image={image} />
          </Konva.Layer>
        </Konva.Stage>
      </Box>
    </main>
  );
};
