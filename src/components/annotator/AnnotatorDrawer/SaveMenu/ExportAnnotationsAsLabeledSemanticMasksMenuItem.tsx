import React from "react";
import { useSelector } from "react-redux";
import JSZip from "jszip";

import { MenuItem, ListItemText } from "@mui/material";

import { annotatorImagesSelector } from "store/annotator";
import { annotationCategoriesSelector } from "store/project";

import { saveAnnotationsAsLabeledSemanticSegmentationMasks } from "utils/common/imageHelper";

type SaveAnnotationsMenuItemProps = {
  handleMenuClose: () => void;
};

export const ExportAnnotationsAsLabeledSemanticMasksMenuItem = ({
  handleMenuClose,
}: SaveAnnotationsMenuItemProps) => {
  const images = useSelector(annotatorImagesSelector);
  const annotationCategories = useSelector(annotationCategoriesSelector);

  const onExport = () => {
    handleMenuClose();

    let zip = new JSZip();

    saveAnnotationsAsLabeledSemanticSegmentationMasks(
      images,
      annotationCategories,
      zip
    );
  };

  return (
    <MenuItem onClick={onExport}>
      <ListItemText primary="Labeled semantic masks" />
    </MenuItem>
  );
};
