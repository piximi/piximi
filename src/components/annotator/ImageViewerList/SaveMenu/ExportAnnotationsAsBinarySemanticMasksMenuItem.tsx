import React from "react";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { useSelector } from "react-redux";
import { annotationCategoriesSelector } from "store/selectors";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";
import JSZip from "jszip";
import { saveAnnotationsAsLabelMatrix } from "image/imageHelper";
import { saveAs } from "file-saver";

type SaveAnnotationsMenuItemProps = {
  popupState: any;
  handleCloseMenu: () => void;
};

export const ExportAnnotationsAsBinarySemanticMasksMenuItem = ({
  popupState,
  handleCloseMenu,
}: SaveAnnotationsMenuItemProps) => {
  const images = useSelector(annotatorImagesSelector);
  const annotationCategories = useSelector(annotationCategoriesSelector);

  const onExport = () => {
    popupState.close();
    handleCloseMenu();

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
