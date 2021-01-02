import React from "react";
import { Image } from "../../../types/Image";
import * as Konva from "react-konva";
import useImage from "use-image";
import { useStyles } from "./ImageViewerContent.css";

type ImageViewerProps = {
  data: Image;
};

export const ImageViewerContent = ({ data }: ImageViewerProps) => {
  const [image] = useImage(data?.src);

  const classes = useStyles();

  return (
    <main className={classes.content}>
      <div className={classes.toolbar} />

      <Konva.Stage height={data.shape?.r} width={data.shape?.c}>
        <Konva.Layer>
          <Konva.Image image={image} />
        </Konva.Layer>
      </Konva.Stage>
    </main>
  );
};
