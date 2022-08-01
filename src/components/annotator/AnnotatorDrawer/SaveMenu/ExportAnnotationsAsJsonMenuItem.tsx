import React from "react";
import { useSelector } from "react-redux";
import { saveAs } from "file-saver";

import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";

import { activeSerializedAnnotationsSelector } from "store/selectors/activeSerializedAnnotationsSelector";

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
