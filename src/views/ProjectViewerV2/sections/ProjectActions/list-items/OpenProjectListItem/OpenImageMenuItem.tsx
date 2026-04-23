import React from "react";

import { ListItemText, MenuItem } from "@mui/material";

import { useFileLoader } from "hooks";

import { TiffConfigDialog } from "components/dialogs";

import { useFileUploadContext } from "contexts";

type OpenImageMenuItemProps = {
  onCloseMenu: () => void;
};

// TODO: MenuItem??

export const OpenImageMenuItem = ({ onCloseMenu }: OpenImageMenuItemProps) => {
  const uploadFiles = useFileUploadContext();
  const {
    upload,
    tiffDialogOpen,
    pendingTiffAnalysis,
    handleTiffDialog,
    handleConfirmTiffConfig,
    handleCancelTiffConfig,
  } = useFileLoader();
  const onOpenImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.currentTarget.files || !uploadFiles) return;
    const files: FileList = Object.assign([], event.currentTarget.files);

    await upload(files, { onTiffDialog: handleTiffDialog });

    onCloseMenu();
  };

  return (
    <React.Fragment>
      <MenuItem component="label" dense>
        <ListItemText primary="New Image" />
        <input
          accept="image/*,.dcm"
          hidden
          multiple
          id="open-image"
          onChange={onOpenImage}
          type="file"
        />
      </MenuItem>
      {pendingTiffAnalysis !== null && (
        <TiffConfigDialog
          open={tiffDialogOpen}
          analysisResult={pendingTiffAnalysis}
          onCancel={handleCancelTiffConfig}
          onConfirm={handleConfirmTiffConfig}
        />
      )}
    </React.Fragment>
  );
};
