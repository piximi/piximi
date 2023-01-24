import React from "react";
import { useSelector } from "react-redux";
import JSZip from "jszip";

import { MenuItem, ListItemText } from "@mui/material";

import { annotatorImagesSelector } from "store/annotator";
import { annotationCategoriesSelector } from "store/project";

import { saveAnnotationsAsBinaryInstanceSegmentationMasks } from "utils/common/imageHelper";

type SaveAnnotationsMenuItemProps = {
  handleMenuClose: () => void;
};

export const ExportAnnotationsAsBinaryInstancesMenuItem = ({
  handleMenuClose,
}: SaveAnnotationsMenuItemProps) => {
  const images = useSelector(annotatorImagesSelector);
  const annotationCategories = useSelector(annotationCategoriesSelector);

  const onExport = () => {
    handleMenuClose();

    let zip = new JSZip();

    saveAnnotationsAsBinaryInstanceSegmentationMasks(
      images,
      annotationCategories,
      zip
    );
  };

  return (
    <MenuItem onClick={onExport}>
      <ListItemText primary="Binary instance masks" />
    </MenuItem>
  );
};
