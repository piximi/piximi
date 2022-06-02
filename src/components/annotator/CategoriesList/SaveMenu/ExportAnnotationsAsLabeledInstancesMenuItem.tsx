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
import { saveAnnotationsAsLabelMatrix } from "../../../../image/imageHelper";
import { saveAs } from "file-saver";

type SaveAnnotationsMenuItemProps = {
  popupState: any;
  handleCloseMenu: () => void;
};

export const ExportAnnotationsAsLabeledInstancesMenuItem = ({
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

    Promise.all(
      saveAnnotationsAsLabelMatrix(images, categories, zip, true)
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
