import React from "react";
import { Download as DownloadIcon } from "@mui/icons-material";

import { useMenu } from "hooks";

import { CustomListItemButton } from "components/ui/CustomListItemButton";
import { ExportAnnotationsMenu } from "./ExportAnnotationsMenu";

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
