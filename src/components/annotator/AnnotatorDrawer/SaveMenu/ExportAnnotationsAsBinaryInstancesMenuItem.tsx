import React from "react";
import { useSelector } from "react-redux";
import JSZip from "jszip";

import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";

import {
  annotationCategoriesSelector,
  imageInstancesSelector,
} from "store/selectors";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";

import { saveAnnotationsAsBinaryInstanceSegmentationMasks } from "image/imageHelper";

type SaveAnnotationsMenuItemProps = {
  popupState: any;
  handleCloseMenu: () => void;
};

export const ExportAnnotationsAsBinaryInstancesMenuItem = ({
  popupState,
  handleCloseMenu,
}: SaveAnnotationsMenuItemProps) => {
  const annotations = useSelector(imageInstancesSelector);
  const images = useSelector(annotatorImagesSelector);
  const annotationCategories = useSelector(annotationCategoriesSelector);

  const onExport = () => {
    popupState.close();
    handleCloseMenu();

    if (!annotations.length) return;

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
