import React from "react";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { useSelector } from "react-redux";
import {
  categoriesSelector,
  imageInstancesSelector,
} from "../../../../annotator/store/selectors";
import { imagesSelector } from "../../../../annotator/store/selectors/imagesSelector";
import JSZip from "jszip";
import {
  saveAnnotationsAsLabeledSemanticSegmentationMasks,
  saveAnnotationsAsLabelMatrix,
} from "../../../../annotator/image/imageHelper";
import { saveAs } from "file-saver";

type SaveAnnotationsMenuItemProps = {
  popupState: any;
  handleCloseMenu: () => void;
};

export const ExportAnnotationsAsBinarySemanticMasksMenuItem = ({
  popupState,
  handleCloseMenu,
}: SaveAnnotationsMenuItemProps) => {
  const annotations = useSelector(imageInstancesSelector);
  const images = useSelector(imagesSelector);
  const categories = useSelector(categoriesSelector);

  const onExport = () => {
    popupState.close();
    handleCloseMenu();

    if (!annotations) return;

    let zip = new JSZip();
    Promise.all(
      saveAnnotationsAsLabelMatrix(images, categories, zip, false, true)
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
