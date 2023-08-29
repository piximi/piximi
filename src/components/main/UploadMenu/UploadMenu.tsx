import React, { useState } from "react";

import {
  Fade,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
} from "@mui/material";
import ComputerIcon from "@mui/icons-material/Computer";

import { useUpload } from "hooks";

import { ImageShapeDialog } from "components/dialogs";
import { StyledMenuItem } from "./StyledMenuItem";

import { ImageShapeEnum, ImageShapeInfo } from "utils/common/image";

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

  const handleClose = () => {
    setOpenDimensionsDialogBox(false);
  };

  const [files, setFiles] = useState<FileList>();

  const uploadFiles = useUpload(setOpenDimensionsDialogBox, false);
  const onUploadFromComputerChange = async (
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
        onChange={onUploadFromComputerChange}
      />
      <Menu
        PaperProps={{ style: { width: 320 } }}
        TransitionComponent={Fade}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        onClose={onClose}
        open={open}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <ListSubheader
          sx={{
            color: "#80868b",
            margin: "16px",
            letterSpacing: ".07272727em",
            fontSize: ".6875rem",
            fontWeight: 500,
            lineHeight: "1rem",
            textTransform: "uppercase",
            maxWidth: 320,
          }}
        >
          Upload from
        </ListSubheader>

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
