import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { saveAs } from "file-saver";
import JSZip from "jszip";

import { Divider, Menu, MenuList, MenuItem, Typography } from "@mui/material";

import { useTranslation } from "hooks";

import { annotationCategoriesSelector } from "store/project";
import { annotatorImagesSelector, imageViewerSlice } from "store/image-viewer";
import { activeImageSelector } from "store/common";

import { ImageType } from "types";

import {
  saveAnnotationsAsLabelMatrix,
  saveAnnotationsAsLabeledSemanticSegmentationMasks,
  saveAnnotationsAsBinaryInstanceSegmentationMasks,
} from "image/imageHelper";

type ImageMenuProps = {
  anchorElImageMenu: any;
  selectedImage: ImageType;
  onCloseImageMenu: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  openImageMenu: boolean;
};

export const ImageMenu = ({
  anchorElImageMenu,
  selectedImage,
  onCloseImageMenu,
  openImageMenu,
}: ImageMenuProps) => {
  const dispatch = useDispatch();
  const annotationCategories = useSelector(annotationCategoriesSelector);

  const images = useSelector(annotatorImagesSelector);
  const activeImage = useSelector(activeImageSelector);

  const onClearAnnotationsClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    if (!selectedImage) return;
    dispatch(
      imageViewerSlice.actions.deleteAllImageInstances({
        imageId: selectedImage.id,
      })
    );
    onCloseImageMenu(event);
  };

  const onDeleteImage = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!selectedImage) return;

    batch(() => {
      if (activeImage && selectedImage.id === activeImage.id) {
        let newActiveImageId = undefined;
        const activeImageIdx = images.findIndex(
          (image) => image.id === activeImage.id
        );

        if (images.length > 1) {
          newActiveImageId =
            activeImageIdx === 0 ? images[1].id : images[activeImageIdx - 1].id;
        }

        dispatch(
          imageViewerSlice.actions.setActiveImage({ imageId: newActiveImageId })
        );
      }

      dispatch(imageViewerSlice.actions.deleteImage({ id: selectedImage.id }));
    });

    onCloseImageMenu(event);
  };

  const onExportLabeledInstanceMasks = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    let zip = new JSZip();

    if (!selectedImage) return;

    Promise.all(
      saveAnnotationsAsLabelMatrix(
        [selectedImage],
        annotationCategories,
        zip,
        true
      )
    ).then(() => {
      zip.generateAsync({ type: "blob" }).then((blob) => {
        saveAs(blob, "labeled_instances.zip");
      });
    });
  };

  const onExportBinaryInstanceMasks = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    let zip = new JSZip();

    if (!selectedImage) return;

    saveAnnotationsAsBinaryInstanceSegmentationMasks(
      [selectedImage],
      annotationCategories,
      zip
    );
  };

  const onExportLabels = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    let zip = new JSZip();

    if (!selectedImage) return;

    Promise.all(
      saveAnnotationsAsLabelMatrix([selectedImage], annotationCategories, zip)
    ).then(() => {
      zip.generateAsync({ type: "blob" }).then((blob) => {
        saveAs(blob, "labels.zip");
      });
    });
  };

  const onExportLabeledSemanticMasks = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    let zip = new JSZip();

    if (!selectedImage) return;

    saveAnnotationsAsLabeledSemanticSegmentationMasks(
      [selectedImage],
      annotationCategories,
      zip
    );
  };

  const onExportBinarySemanticMasks = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    let zip = new JSZip();

    if (!selectedImage) return;

    Promise.all(
      saveAnnotationsAsLabelMatrix(
        [selectedImage],
        annotationCategories,
        zip,
        false,
        true
      )
    ).then(() => {
      zip.generateAsync({ type: "blob" }).then((blob) => {
        saveAs(blob, "binary_semantic.zip");
      });
    });
  };

  const t = useTranslation();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLLIElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Menu
      anchorEl={anchorElImageMenu}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      // getContentAnchorEl={null}
      onClose={onCloseImageMenu}
      open={openImageMenu}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      <MenuList dense variant="menu">
        <div>
          <MenuItem onClick={handleClick}>Export annotations as</MenuItem>
          <Menu
            id="save-annotations-as-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuList dense variant="menu">
              <div>
                <MenuItem onClick={onExportLabeledInstanceMasks}>
                  <Typography variant="inherit">
                    {t("Labeled instance masks")}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={onExportBinaryInstanceMasks}>
                  <Typography variant="inherit">
                    {t("Binary instance masks")}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={onExportLabeledSemanticMasks}>
                  <Typography variant="inherit">
                    {t("Labeled semantic masks")}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={onExportBinarySemanticMasks}>
                  <Typography variant="inherit">
                    {t("Binary semantic masks")}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={onExportLabels}>
                  <Typography variant="inherit">
                    {t("Label matrices")}
                  </Typography>
                </MenuItem>
              </div>
            </MenuList>
          </Menu>
          <Divider />
          <MenuItem onClick={onClearAnnotationsClick}>
            <Typography variant="inherit">{t("Clear Annotations")}</Typography>
          </MenuItem>
          <MenuItem onClick={onDeleteImage}>
            <Typography variant="inherit">{t("Delete Image")}</Typography>
          </MenuItem>
        </div>
      </MenuList>
    </Menu>
  );
};
