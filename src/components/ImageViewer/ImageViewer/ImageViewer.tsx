import React, { useCallback, useEffect, useState } from "react";
import { CssBaseline } from "@mui/material";
import { ImageType } from "../../../annotator/types/ImageType";
import { batch, useDispatch } from "react-redux";
import { CategoriesList } from "../CategoriesList";
import { ToolOptions } from "../ToolOptions";
import { Tools } from "../Tools";
import {
  addImages,
  applicationSlice,
  setActiveImage,
  setOperation,
  setSelectedAnnotations,
} from "../../../annotator/store";
import { Content } from "../Content";
import { ThemeProvider } from "@mui/styles";
import { useStyles } from "./ImageViewer.css";
import { theme } from "./theme";
import * as ImageJS from "image-js";
import { ShapeType } from "../../../annotator/types/ShapeType";
import { loadLayersModelThunk } from "../../../annotator/store/thunks";
import { ToolType } from "../../../annotator/types/ToolType";
import { v4 } from "uuid";

type ImageViewerProps = {
  image?: ImageType;
};

export const ImageViewer = (props: ImageViewerProps) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const path =
      "https://raw.githubusercontent.com/zaidalyafeai/HostedModels/master/unet-128/model.json";

    dispatch(loadLayersModelThunk({ name: "foo", path: path }));
  });

  useEffect(() => {
    if (props.image) {
      dispatch(
        applicationSlice.actions.setActiveImage({ image: props.image.id })
      );
    }
  }, [dispatch, props.image]);

  const classes = useStyles();

  const [, setDropped] = useState<File[]>([]);

  const onDrop = useCallback(
    (item) => {
      if (item) {
        for (let i = 0; i < item.files.length; i++) {
          const file = item.files[i];

          file.arrayBuffer().then((buffer: any) => {
            ImageJS.Image.load(buffer).then((image) => {
              const shape: ShapeType = {
                channels: image.components,
                frames: 1,
                height: image.height,
                planes: 1,
                width: image.width,
              };

              const imageDataURL = image.toDataURL("image/png", {
                useCanvas: true,
              });

              const loaded: ImageType = {
                avatar: image
                  .resize({ width: 50 })
                  .toDataURL("image/png", { useCanvas: true }),
                id: v4(),
                annotations: [],
                name: file.name,
                shape: shape,
                originalSrc: imageDataURL,
                src: imageDataURL,
              };

              dispatch(addImages({ newImages: [loaded] }));

              if (i === 0) {
                batch(() => {
                  dispatch(
                    setActiveImage({
                      image: loaded.id,
                    })
                  );

                  dispatch(
                    setSelectedAnnotations({
                      selectedAnnotations: [],
                      selectedAnnotation: undefined,
                    })
                  );

                  dispatch(
                    setOperation({ operation: ToolType.RectangularAnnotation })
                  );
                });
              }
            });
          });
        }
      }
    },
    [setDropped]
  );

  return (
    <>
      {/*// @ts-ignore */}
      <ThemeProvider theme={theme}>
        <div className={classes.root}>
          <CssBaseline />

          <CategoriesList />

          <Content onDrop={onDrop} />

          <ToolOptions />

          <Tools />
        </div>
      </ThemeProvider>
    </>
  );
};
