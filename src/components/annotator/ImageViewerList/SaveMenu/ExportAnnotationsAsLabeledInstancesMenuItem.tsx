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

export const ExportAnnotationsAsLabeledInstancesMenuItem = ({
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
      saveAnnotationsAsLabelMatrix(images, annotationCategories, zip, true)
    ).then(() => {
      zip.generateAsync({ type: "blob" }).then((blob) => {
        saveAs(blob, "labeled_instances.zip");
      });
    });
  };

  return (
    <MenuItem onClick={onExport}>
      <ListItemText primary="Labeled instance masks" />
    </MenuItem>
  );
};
