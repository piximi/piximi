import React from "react";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { useSelector } from "react-redux";
import {
  annotationCategoriesSelector,
  imageInstancesSelector,
} from "store/selectors";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";
import JSZip from "jszip";
import { saveAnnotationsAsLabeledSemanticSegmentationMasks } from "image/imageHelper";

type SaveAnnotationsMenuItemProps = {
  popupState: any;
  handleCloseMenu: () => void;
};

export const ExportAnnotationsAsLabeledSemanticMasksMenuItem = ({
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
