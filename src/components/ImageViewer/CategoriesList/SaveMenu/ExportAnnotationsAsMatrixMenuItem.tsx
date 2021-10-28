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
import { saveAs } from "file-saver";
import { saveAnnotationsAsLabelMatrix } from "../../../../annotator/image/imageHelper";

type SaveAnnotationsMenuItemProps = {
  popupState: any;
  handleCloseMenu: () => void;
};

export const ExportAnnotationsAsMatrixMenuItem = ({
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

    Promise.all(saveAnnotationsAsLabelMatrix(images, categories, zip)).then(
      () => {
        zip.generateAsync({ type: "blob" }).then((blob) => {
          saveAs(blob, "labels.zip");
        });
      }
    );
  };

  return (
    <MenuItem onClick={onExport}>
      <ListItemText primary="Label matrices" />
    </MenuItem>
  );
};
