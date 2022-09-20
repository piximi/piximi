import React from "react";
import { useSelector } from "react-redux";
import { saveAs } from "file-saver";

import { MenuItem, ListItemText } from "@mui/material";
import { activeSerializedAnnotationsSelector } from "store/common";

type SaveAnnotationsMenuItemProps = {
  handleMenuClose: () => void;
};

export const ExportAnnotationsAsJsonMenuItem = ({
  handleMenuClose,
}: SaveAnnotationsMenuItemProps) => {
  const annotations = useSelector(activeSerializedAnnotationsSelector);

  const onSaveAnnotations = () => {
    handleMenuClose();
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
