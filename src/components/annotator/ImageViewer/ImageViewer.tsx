import React, { useCallback, useEffect } from "react";
import { CssBaseline } from "@mui/material";
import { batch, useDispatch } from "react-redux";
import { CategoriesList } from "../CategoriesList";
import { ToolOptions } from "../ToolOptions";
import { Tools } from "../Tools";
import { Content } from "../Content";
import { useStyles } from "./ImageViewer.css";
import * as ImageJS from "image-js";
import { ShapeType } from "../../../types/ShapeType";
import { ToolType } from "../../../types/ToolType";
import { v4 as uuidv4 } from "uuid";
import {
  addImages,
  imageViewerSlice,
  setActiveImage,
  setOperation,
  setSelectedAnnotations,
} from "../../../store/slices";
import { Image } from "../../../types/Image";
import { Partition } from "../../../types/Partition";
import { UNKNOWN_CATEGORY_ID } from "../../../types/Category";

type ImageViewerProps = {
  image?: Image;
};

export const ImageViewer = ({ image }: ImageViewerProps) => {
  const dispatch = useDispatch();
  //
  // useEffect(() => {
  //   const path =
  //     "https://raw.githubusercontent.com/zaidalyafeai/HostedModels/master/unet-128/model.json";
  //
  //   dispatch(loadLayersModelThunk({ name: "foo", path: path }));
  // });

  useEffect(() => {
    if (image) {
      dispatch(imageViewerSlice.actions.setActiveImage({ image: image.id }));
    }
  }, [dispatch, image]);

  const classes = useStyles();

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

              const loaded: Image = {
                categoryId: UNKNOWN_CATEGORY_ID,
                id: uuidv4(),
                annotations: [],
                name: file.name,
                partition: Partition.Inference,
                shape: shape,
                originalSrc: [imageDataURL],
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
    [dispatch]
  );

  return (
    <>
      <div className={classes.root}>
        <CssBaseline />

        <CategoriesList />

        <Content onDrop={onDrop} />

        <ToolOptions />

        <Tools />
      </div>
    </>
  );
};
