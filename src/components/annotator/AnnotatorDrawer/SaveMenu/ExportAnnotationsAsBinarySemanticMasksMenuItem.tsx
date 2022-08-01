import React from "react";
import { useSelector } from "react-redux";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";

import {
  annotationCategoriesSelector,
  imageInstancesSelector,
} from "store/selectors";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";

import { saveAnnotationsAsLabelMatrix } from "image/imageHelper";

type SaveAnnotationsMenuItemProps = {
  popupState: any;
  handleCloseMenu: () => void;
};

export const ExportAnnotationsAsBinarySemanticMasksMenuItem = ({
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
    Promise.all(
      saveAnnotationsAsLabelMatrix(
        images,
        annotationCategories,
        zip,
        false,
        true
      )
    ).then(() => {
      zip.generateAsync({ type: "blob" }).then((blob) => {
        saveAs(blob, "binary_semantics.zip");
      });
    });
  };

  return (
    <MenuItem onClick={onExport}>
      <ListItemText primary="Binary semantic masks" />
    </MenuItem>
  );
};
