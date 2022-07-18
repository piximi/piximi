import React from "react";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { useSelector } from "react-redux";
import { annotationCategoriesSelector } from "store/selectors";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { saveAnnotationsAsLabelMatrix } from "image/imageHelper";

type SaveAnnotationsMenuItemProps = {
  popupState: any;
  handleCloseMenu: () => void;
};

export const ExportAnnotationsAsMatrixMenuItem = ({
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
      saveAnnotationsAsLabelMatrix(images, annotationCategories, zip)
    ).then(() => {
      zip.generateAsync({ type: "blob" }).then((blob) => {
        saveAs(blob, "labels.zip");
      });
    });
  };

  return (
    <MenuItem onClick={onExport}>
      <ListItemText primary="Label matrices" />
    </MenuItem>
  );
};
