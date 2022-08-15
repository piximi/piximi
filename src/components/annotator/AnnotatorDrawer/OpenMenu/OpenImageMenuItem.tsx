import React, { useState } from "react";

import { ListItemText, MenuItem } from "@mui/material";

import { useUpload } from "hooks";

import { ImageShapeDialog } from "components/common/ImageShapeDialog/ImageShapeDialog";

type OpenImageMenuItemProps = {
  popupState: any;
};

export const OpenImageMenuItem = ({ popupState }: OpenImageMenuItemProps) => {
  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
    popupState.close();
  };

  const [files, setFiles] = React.useState<FileList>();

  const uploadFiles = useUpload(setOpenDimensionsDialogBox, true);
  const onOpenImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.currentTarget.files) return;
    const files: FileList = Object.assign([], event.currentTarget.files);

    await uploadFiles(files);
    event.target.value = "";
    handleClose();
    setFiles(files);
  };

  return (
    <React.Fragment>
      <MenuItem component="label">
        <ListItemText primary="Open new image" />
        <input
          accept="image/*,.dcm"
          hidden
          multiple
          id="open-image"
          onChange={onOpenImage}
          type="file"
        />
      </MenuItem>
      {files?.length && (
        <ImageShapeDialog
          files={files}
          open={openDimensionsDialogBox}
          onClose={handleClose}
          isUploadedFromAnnotator={true}
        />
      )}
    </React.Fragment>
  );
};
