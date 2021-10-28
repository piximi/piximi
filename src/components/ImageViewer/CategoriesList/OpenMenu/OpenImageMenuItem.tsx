import { batch, useDispatch } from "react-redux";
import React, { ChangeEvent } from "react";
import * as ImageJS from "image-js";
import { ShapeType } from "../../../../annotator/types/ShapeType";
import { ImageType } from "../../../../annotator/types/ImageType";
import { v4 } from "uuid";
import {
  addImages,
  setActiveImage,
  setSelectedAnnotations,
} from "../../../../annotator/store/slices";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";

type OpenImageMenuItemProps = {
  popupState: any;
};

export const OpenImageMenuItem = ({ popupState }: OpenImageMenuItemProps) => {
  const dispatch = useDispatch();

  const onOpenImage = (
    event: React.ChangeEvent<HTMLInputElement>,
    onClose: () => void
  ) => {
    onClose();

    event.persist();

    if (event.currentTarget.files) {
      for (let i = 0; i < event.currentTarget.files.length; i++) {
        const file = event.currentTarget.files[i];

        file.arrayBuffer().then((buffer) => {
          ImageJS.Image.load(buffer).then((image) => {
            //check whether name already exists
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
              });
            }
          });
        });
      }
    }
  };

  return (
    <MenuItem component="label">
      <ListItemText primary="Open new image" />
      <input
        accept="image/*"
        hidden
        multiple
        id="open-image"
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onOpenImage(event, popupState.close)
        }
        type="file"
      />
    </MenuItem>
  );
};
