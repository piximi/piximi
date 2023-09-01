import React, { useState } from "react";

import { Fade, ListItemIcon, ListItemText, Menu } from "@mui/material";
import ComputerIcon from "@mui/icons-material/Computer";

import { useUpload } from "hooks";

import { ImageShapeDialog } from "components/dialogs";
import { StyledMenuItem } from "./StyledMenuItem";

import { ImageShapeEnum, ImageShapeInfo } from "utils/common/image";

//TODO: MenuItem??

type UploadMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: (event: any) => void;
  open: boolean;
};

export const UploadMenu = ({ anchorEl, onClose, open }: UploadMenuProps) => {
  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);
  const [imageShape, setImageShape] = useState<ImageShapeInfo>({
    shape: ImageShapeEnum.InvalidImage,
  });
  const [files, setFiles] = useState<FileList>();

  const uploadFiles = useUpload(setOpenDimensionsDialogBox, false);

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
  };
  const handleUploadFromComputerChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.currentTarget.files) return;
    const files: FileList = Object.assign([], event.currentTarget.files);
    const imageShapeInfo = await uploadFiles(files);
    event.target.value = "";
    setImageShape(imageShapeInfo);
    setFiles(files);
    onClose(event);
  };

  return (
    <>
      <input
        accept="image/*"
        hidden
        type="file"
        multiple
        id="upload-images"
        onChange={handleUploadFromComputerChange}
      />
      <Menu
        TransitionComponent={Fade}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={onClose}
        open={open}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <label htmlFor="upload-images">
          <StyledMenuItem component="span" dense onClick={onClose}>
            <ListItemIcon>
              <ComputerIcon />
            </ListItemIcon>
            <ListItemText primary="Computer" />
          </StyledMenuItem>
        </label>

        {/* <DropboxMenuItem onClose={onClose} /> */}
      </Menu>
      {files && (
        <ImageShapeDialog
          files={files}
          open={openDimensionsDialogBox}
          onClose={handleClose}
          isUploadedFromAnnotator={false}
          referenceImageShape={imageShape}
        />
      )}
    </>
  );
};
