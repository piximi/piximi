import React from "react";

import DownloadIcon from "@mui/icons-material/Download";

import { useMenu } from "hooks";
import { ExportAnnotationsMenu } from "sections/menus";
import { CustomListItemButton } from "../../../components/CustomListItemButton";

export const ExportAnnotationsListItem = () => {
  const { anchorEl, onClose, onOpen, open } = useMenu();

  return (
    <>
      <CustomListItemButton
        primaryText="Export Annotations"
        onClick={onOpen}
        icon={<DownloadIcon />}
        selected={open}
      />

      <ExportAnnotationsMenu
        anchorEl={anchorEl}
        onClose={onClose}
        open={open}
      />
    </>
  );
};
