import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { activeImageColorsSelector } from "../../../../../store/selectors/activeImageColorsSelector";
import { imageViewerSlice, projectSlice } from "../../../../../store/slices";
import {
  convertImageURIsToImageData,
  mapChannelstoSpecifiedRGBImage,
} from "../../../../../image/imageHelper";
import {
  imagesSelector,
  imageViewerImagesSelector,
  selectedImagesSelector,
} from "../../../../../store/selectors";
import { activeImageIdSelector } from "../../../../../store/selectors/activeImageIdSelector";
import { ImageType } from "../../../../../types/ImageType";
import { activeImagePlaneSelector } from "../../../../../store/selectors/activeImagePlaneSelector";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useDialog } from "hooks";

export const ApplyColorsButton = () => {
  const {
    onClose: setApplyColorsDialogClose,
    onOpen: setApplyColorsDialogOpen,
    open: applyColorsDialogOpen,
  } = useDialog();

  return (
    <>
      <ListItem button onClick={setApplyColorsDialogOpen}>
        <ListItemText>{"Apply to all images"}</ListItemText>
      </ListItem>
      <ApplyColorsDialog
        open={applyColorsDialogOpen}
        onClose={setApplyColorsDialogClose}
      />
    </>
  );
};

type ApplyColorsDialogProps = {
  open: boolean;
  onClose: () => void;
};

const ApplyColorsDialog = ({ open, onClose }: ApplyColorsDialogProps) => {
  const dispatch = useDispatch();
  const annotatorImages = useSelector(imageViewerImagesSelector);
  const projectImages = useSelector(imagesSelector);
  const selectedImages = useSelector(selectedImagesSelector);
  const activeImageColors = useSelector(activeImageColorsSelector);
  const activeImageId = useSelector(activeImageIdSelector);
  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const changeImageColor = async (image: ImageType) => {
    if (image.id === activeImageId) {
      return image; //don't do anything, the imageSrc has already been updated on slider change / toggling
    }

    if (image.shape.channels !== activeImageColors.length) {
      //if mismatch between image size and desired colors, don't do anything on the image
      return image;
    }

    return convertImageURIsToImageData(
      new Array(image.originalSrc[activeImagePlane])
    ).then((originalData) => {
      const modifiedURI = mapChannelstoSpecifiedRGBImage(
        originalData[0],
        activeImageColors,
        image.shape.height,
        image.shape.width
      );

      return { ...image, colors: activeImageColors, src: modifiedURI };
    });
  };

  const applyToAnnotatorImages = () => {
    dispatch(
      imageViewerSlice.actions.setCurrentColors({
        currentColors: activeImageColors,
      })
    );

    Promise.all(
      annotatorImages.map(async (image: ImageType) => changeImageColor(image))
    ).then((updatedImages: Array<ImageType>) => {
      dispatch(imageViewerSlice.actions.setImages({ images: updatedImages }));
    });
  };

  const applyToUnselectedImages = () => {
    const unselectedImages = projectImages.filter((image: ImageType) => {
      return !selectedImages.includes(image.id);
    });

    Promise.all(
      unselectedImages.map(async (image: ImageType) => changeImageColor(image))
    ).then((updatedImages: Array<ImageType>) => {
      dispatch(
        projectSlice.actions.setImages({
          images: [...annotatorImages, ...updatedImages],
        })
      );
    });
  };

  const onApplyToAnnotatorImages = () => {
    applyToAnnotatorImages();
    onClose();
  };

  const onApplyToAllImages = () => {
    applyToAnnotatorImages();
    applyToUnselectedImages();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Select Image Set</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Apply to all open and future images, or just the selected images in
          the Annotator?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onApplyToAllImages}>
          Apply to all open and future images
        </Button>
        <Button onClick={onApplyToAnnotatorImages}>
          Apply to all images in Annotator
        </Button>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
