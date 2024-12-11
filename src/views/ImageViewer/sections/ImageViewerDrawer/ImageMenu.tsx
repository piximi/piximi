import React from "react";
import { useDispatch } from "react-redux";
// import JSZip from "jszip";
import { Divider, Menu, MenuList, MenuItem, Typography } from "@mui/material";

import { useTranslation } from "hooks";

import { dataSlice } from "store/data/dataSlice";

import { ImageObject } from "store/data/types";
import { imageViewerSlice } from "store/imageViewer";

type ImageMenuProps = {
  anchorElImageMenu: any;
  selectedImage: ImageObject;
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

  const handleClearAnnotations = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    if (!selectedImage) return;
    dispatch(
      imageViewerSlice.actions.removeActiveAnnotationIds({
        annotationIds: selectedImage.containing,
      })
    );
    dispatch(
      dataSlice.actions.deleteThings({
        thingIds: selectedImage.containing,
        disposeColorTensors: true,
      })
    );

    onCloseImageMenu(event);
  };

  const handleExportLabeledInstanceMasks = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    //let zip = new JSZip();

    if (!selectedImage.id) return;
    // saveAnnotationsAsLabelMatrix(
    //   [selectedImage],
    //   annotations,
    //   annotationCategories,
    //   zip,
    //   true
    // ).then(() => {
    //   zip.generateAsync({ type: "blob" }).then((blob) => {
    //     saveAs(blob, "labeled_instances.zip");
    //   });
    // });
  };

  const handleExportBinaryInstanceMasks = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    //let zip = new JSZip();

    if (!selectedImage) return;

    // saveAnnotationsAsBinaryInstanceSegmentationMasks(
    //   [selectedImage],
    //   annotations,
    //   annotationCategories,
    //   zip,
    //   "binary_instances"
    // );
  };

  const handleExportLabels = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    //let zip = new JSZip();

    if (!selectedImage) return;

    // saveAnnotationsAsLabelMatrix(
    //   [selectedImage],
    //   annotations,
    //   annotationCategories,
    //   zip
    // ).then(() => {
    //   zip.generateAsync({ type: "blob" }).then((blob) => {
    //     saveAs(blob, "labels.zip");
    //   });
    // });
  };

  const handleExportLabeledSemanticMasks = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    //let zip = new JSZip();

    if (!selectedImage) return;

    // saveAnnotationsAsLabeledSemanticSegmentationMasks(
    //   [selectedImage],
    //   annotations,
    //   annotationCategories,
    //   zip,
    //   "labeled_semantic"
    // );
  };

  const handleExportBinarySemanticMasks = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(null);
    onCloseImageMenu(event);

    //let zip = new JSZip();

    if (!selectedImage) return;

    // saveAnnotationsAsLabelMatrix(
    //   [selectedImage],
    //   annotations,
    //   annotationCategories,
    //   zip,
    //   false,
    //   true
    // ).then(() => {
    //   zip.generateAsync({ type: "blob" }).then((blob) => {
    //     saveAs(blob, "binary_semantic.zip");
    //   });
    // });
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
                <MenuItem onClick={handleExportLabeledInstanceMasks}>
                  <Typography variant="inherit">
                    {t("Labeled instance masks")}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleExportBinaryInstanceMasks}>
                  <Typography variant="inherit">
                    {t("Binary instance masks")}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleExportLabeledSemanticMasks}>
                  <Typography variant="inherit">
                    {t("Labeled semantic masks")}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleExportBinarySemanticMasks}>
                  <Typography variant="inherit">
                    {t("Binary semantic masks")}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleExportLabels}>
                  <Typography variant="inherit">
                    {t("Label matrices")}
                  </Typography>
                </MenuItem>
              </div>
            </MenuList>
          </Menu>
          <Divider />
          <MenuItem onClick={handleClearAnnotations}>
            <Typography variant="inherit">{t("Clear Annotations")}</Typography>
          </MenuItem>
        </div>
      </MenuList>
    </Menu>
  );
};
