import React from "react";
import { useSelector } from "react-redux";
import { saveAs } from "file-saver";

import { MenuItem, ListItemText } from "@mui/material";
import { activeSerializedAnnotationsSelector } from "store/common";
import { activeImageSelector } from "store/annotator";

type SaveAnnotationsMenuItemProps = {
  handleMenuClose: () => void;
};

export const ExportAnnotationsAsJsonMenuItem = ({
  handleMenuClose,
}: SaveAnnotationsMenuItemProps) => {
  const annotations = useSelector(activeSerializedAnnotationsSelector);

  const activeImage = useSelector(activeImageSelector);

  const onSaveAnnotations = () => {
    handleMenuClose();
    if (!activeImage || !annotations) return;
    const blob = new Blob([JSON.stringify(annotations)], {
      type: "application/json;charset=utf-8",
    });
    saveAs(blob, `${!activeImage.name}.json`);
  };

  return (
    <MenuItem onClick={onSaveAnnotations}>
      <ListItemText primary="Export annotations as json" />
    </MenuItem>
  );
};
