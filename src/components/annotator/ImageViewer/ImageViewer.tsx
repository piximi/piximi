import React, { useCallback, useEffect } from "react";
import { Box, CssBaseline } from "@mui/material";
import { batch, useDispatch } from "react-redux";
import { CategoriesList } from "../CategoriesList";
import { ToolOptions } from "../ToolOptions";
import { Tools } from "../Tools";
import { Content } from "../Content";
import * as ImageJS from "image-js";
import { ShapeType } from "../../../types/ShapeType";

import { ToolType } from "../../../types/ToolType";
import {
  addImages,
  imageViewerSlice,
  setActiveImage,
  setOperation,
  setSelectedAnnotations,
} from "../../../store/slices";
import { Image } from "../../../types/Image";
import { convertFileToImage } from "../../../image/imageHelper";

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

  const onDrop = useCallback(
    async (item) => {
      if (item) {
        for (let i = 0; i < item.files.length; i++) {
          const image = await convertFileToImage(item.files[i]);
          dispatch(addImages({ newImages: [image] }));

          if (i === 0) {
            batch(() => {
              dispatch(
                setActiveImage({
                  image: image.id,
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
        }
      }
    },
    [dispatch]
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <CategoriesList />

      <Content onDrop={onDrop} />

      <ToolOptions />

      <Tools />
    </Box>
  );
};
