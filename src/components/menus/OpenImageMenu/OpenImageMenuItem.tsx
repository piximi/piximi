import React from "react";

import { ListItemText, MenuItem } from "@mui/material";

import { useFileUpload } from "contexts/FileUploadContext";

//TODO: MenuItem??

type OpenImageMenuItemProps = {
  onCloseMenu: () => void;
};

export const OpenImageMenuItem = ({ onCloseMenu }: OpenImageMenuItemProps) => {
  const uploadFiles = useFileUpload();
  const onOpenImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.currentTarget.files || !uploadFiles) return;
    const files: FileList = Object.assign([], event.currentTarget.files);
    await uploadFiles(files);
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
    </React.Fragment>
  );
};
