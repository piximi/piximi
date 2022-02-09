import React, { ChangeEvent } from "react";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { ImageShapeDialog } from "./ImageShapeDialog";

type OpenImageMenuItemProps = {
  popupState: any;
};

export const OpenImageMenuItem = ({ popupState }: OpenImageMenuItemProps) => {
  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] =
    React.useState(false);

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
    popupState.close();
  };

  const [files, setFiles] = React.useState<FileList>();

  const onOpenImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.persist();

    if (!event.currentTarget.files) return;

    setFiles(event.currentTarget.files);

    setOpenDimensionsDialogBox(true); //open dialog box
  };

  return (
    <React.Fragment>
      <MenuItem component="label">
        <ListItemText primary="Open new image" />
        <input
          accept="image/*"
          hidden
          multiple
          id="open-image"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onOpenImage(event)
          }
          type="file"
        />
      </MenuItem>
      <ImageShapeDialog
        files={files!}
        open={openDimensionsDialogBox}
        onClose={handleClose}
        isUploadedFromAnnotator={true}
      />
    </React.Fragment>
  );
};
