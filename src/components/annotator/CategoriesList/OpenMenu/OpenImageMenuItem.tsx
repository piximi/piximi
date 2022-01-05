import { batch, useDispatch } from "react-redux";
import React, { ChangeEvent } from "react";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import {
  addImages,
  setActiveImage,
  setSelectedAnnotations,
} from "../../../../store/slices";
import { convertFileToImage } from "../../../../image/imageHelper";

type OpenImageMenuItemProps = {
  popupState: any;
};

export const OpenImageMenuItem = ({ popupState }: OpenImageMenuItemProps) => {
  const dispatch = useDispatch();

  const onOpenImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    onClose: () => void
  ) => {
    onClose();
    event.persist();

    if (!event.currentTarget.files) return;

    const files = event.currentTarget.files;

    for (let i = 0; i < files.length; i++) {
      if (i === 0) {
        dispatch(
          setSelectedAnnotations({
            selectedAnnotations: [],
            selectedAnnotation: undefined,
          })
        );
      }
      const image = await convertFileToImage(files[i]);
      batch(() => {
        dispatch(addImages({ newImages: [image] }));
        if (i === 0) dispatch(setActiveImage({ image: image.id }));
      });
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
