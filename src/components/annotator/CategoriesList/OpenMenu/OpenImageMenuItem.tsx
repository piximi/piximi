import { batch, useDispatch } from "react-redux";
import React, { ChangeEvent } from "react";
import * as ImageJS from "image-js";
import { ShapeType } from "../../../../types/ShapeType";
import { v4 as uuidv4 } from "uuid";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import {
  addImages,
  setActiveImage,
  setSelectedAnnotations,
} from "../../../../store/slices";
import { Partition } from "../../../../types/Partition";
import { UNKNOWN_CATEGORY_ID } from "../../../../types/Category";
import { Image } from "../../../../types/Image";

type OpenImageMenuItemProps = {
  popupState: any;
};

export const OpenImageMenuItem = ({ popupState }: OpenImageMenuItemProps) => {
  const dispatch = useDispatch();

  const createImage = (image: ImageJS.Image, filename: string) => {
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
      name: filename,
      shape: shape,
      originalSrc: imageDataURL,
      partition: Partition.Inference,
      src: imageDataURL,
    };

    return loaded;
  };

  const onOpenImage = (
    event: React.ChangeEvent<HTMLInputElement>,
    onClose: () => void
  ) => {
    onClose();

    event.persist();

    if (event.currentTarget.files) {
      for (let i = 0; i < event.currentTarget.files.length; i++) {
        if (i === 0) {
          dispatch(
            setSelectedAnnotations({
              selectedAnnotations: [],
              selectedAnnotation: undefined,
            })
          );
        }

        const file = event.currentTarget.files[i];

        let curr: Image;

        file.arrayBuffer().then((buffer) => {
          ImageJS.Image.load(buffer).then((image) => {
            if (Array.isArray(image)) {
              let activeImageId: string;
              //case where we have a z-stack of images
              let images: Array<Image> = [];
              for (let j = 0; j < image.length; j++) {
                curr = createImage(image[j], file.name);
                if (i === 0 && j === 0) {
                  activeImageId = curr.id;
                }
                images.push(curr);
              }
              //Assign previous and next image references to each image
              for (let j = 0; j < images.length; j++) {
                if (j > 0) {
                  images[j] = { ...images[j], prevImage: images[j - 1].id };
                }
                if (j < images.length - 1) {
                  images[j] = { ...images[j], nextImage: images[j + 1].id };
                }
              }
              batch(() => {
                dispatch(addImages({ newImages: images }));
                if (i === 0) dispatch(setActiveImage({ image: activeImageId }));
              });
            } else {
              //Case where a 2D image was loaded
              curr = createImage(image, file.name);

              batch(() => {
                if (i === 0) {
                  dispatch(
                    setActiveImage({
                      image: curr.id,
                    })
                  );
                }
                dispatch(addImages({ newImages: [curr] }));
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
