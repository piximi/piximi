import { useSelector } from "react-redux";
import { activeSerializedAnnotationsSelector } from "../../../../annotator/store/selectors/activeSerializedAnnotationsSelector";
import { saveAs } from "file-saver";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import React from "react";

type SaveAnnotationsMenuItemProps = {
  popupState: any;
};

export const ExportAnnotationsAsJsonMenuItem = ({
  popupState,
}: SaveAnnotationsMenuItemProps) => {
  const annotations = useSelector(activeSerializedAnnotationsSelector);

  const onSaveAnnotations = () => {
    popupState.close();
    if (!annotations) return;
    const blob = new Blob([JSON.stringify(annotations)], {
      type: "application/json;charset=utf-8",
    });
    saveAs(blob, `${annotations.imageFilename}.json`);
  };

  return (
    <MenuItem onClick={onSaveAnnotations}>
      <ListItemText primary="Export annotations as json" />
    </MenuItem>
  );
};
