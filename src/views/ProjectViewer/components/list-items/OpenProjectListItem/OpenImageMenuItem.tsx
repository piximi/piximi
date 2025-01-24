import React from "react";
import { ListItemText, MenuItem } from "@mui/material";

import { useFileUploadContext } from "contexts";

type OpenImageMenuItemProps = {
  onCloseMenu: () => void;
};

// TODO: MenuItem??
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const OpenImageMenuItem = ({ onCloseMenu }: OpenImageMenuItemProps) => {
  const uploadFiles = useFileUploadContext();
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
