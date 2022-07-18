import React from "react";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { useSelector } from "react-redux";
import { annotationCategoriesSelector } from "store/selectors";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";
import JSZip from "jszip";
import { saveAnnotationsAsBinaryInstanceSegmentationMasks } from "image/imageHelper";

type SaveAnnotationsMenuItemProps = {
  popupState: any;
  handleCloseMenu: () => void;
};

export const ExportAnnotationsAsBinaryInstancesMenuItem = ({
  popupState,
  handleCloseMenu,
}: SaveAnnotationsMenuItemProps) => {
  const images = useSelector(annotatorImagesSelector);
  const annotationCategories = useSelector(annotationCategoriesSelector);

  const onExport = () => {
    popupState.close();
    handleCloseMenu();

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
