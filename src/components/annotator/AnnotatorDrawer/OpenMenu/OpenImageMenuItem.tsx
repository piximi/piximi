import React, { useState } from "react";

import { ListItemText, MenuItem } from "@mui/material";

import { useUpload } from "hooks";

import { ImageShapeDialog } from "components/common/ImageShapeDialog/ImageShapeDialog";

type OpenImageMenuItemProps = {
  onCloseMenu: () => void;
};

export const OpenImageMenuItem = ({ onCloseMenu }: OpenImageMenuItemProps) => {
  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);

  const [files, setFiles] = React.useState<FileList>();

  const uploadFiles = useUpload(setOpenDimensionsDialogBox, true);
  const onOpenImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.currentTarget.files) return;
    const files: FileList = Object.assign([], event.currentTarget.files);

    setFiles(files);

    const needShape = await uploadFiles(files);
    if (!needShape) {
      onCloseMenu();
    }
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
          onClose={() => {
            setOpenDimensionsDialogBox(false);
            onCloseMenu();
          }}
          isUploadedFromAnnotator={true}
        />
      )}
    </React.Fragment>
  );
};
