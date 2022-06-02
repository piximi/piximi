import React from "react";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { useSelector } from "react-redux";
import {
  annotationCategorySelector,
  imageInstancesSelector,
} from "../../../../store/selectors";
import { annotatorImagesSelector } from "../../../../store/selectors/annotatorImagesSelector";
import JSZip from "jszip";
import { saveAnnotationsAsBinaryInstanceSegmentationMasks } from "../../../../image/imageHelper";

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
  const categories = useSelector(annotationCategorySelector);

  const onExport = () => {
    popupState.close();
    handleCloseMenu();

    if (!annotations.length) return;

    let zip = new JSZip();

    saveAnnotationsAsBinaryInstanceSegmentationMasks(images, categories, zip);
  };

  return (
    <MenuItem onClick={onExport}>
      <ListItemText primary="Binary instance masks" />
    </MenuItem>
  );
};
