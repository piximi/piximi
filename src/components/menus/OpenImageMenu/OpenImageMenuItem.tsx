import React, { useState } from "react";

import { ListItemText, MenuItem } from "@mui/material";

import { useUpload } from "hooks";

import { ImageShapeDialog } from "components/dialogs/ImageShapeDialog/ImageShapeDialog";
import { ImageShapeInfo } from "utils/file-io/types";
import { ImageShapeEnum } from "utils/file-io/enums";

//TODO: MenuItem??

type OpenImageMenuItemProps = {
  onCloseMenu: () => void;
};

export const OpenImageMenuItem = ({ onCloseMenu }: OpenImageMenuItemProps) => {
  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);

  const [imageShape, setImageShape] = useState<ImageShapeInfo>({
    shape: ImageShapeEnum.InvalidImage,
  });

  const [files, setFiles] = React.useState<FileList>();

  const uploadFiles = useUpload(setOpenDimensionsDialogBox);
  const onOpenImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.currentTarget.files) return;
    const files: FileList = Object.assign([], event.currentTarget.files);
    const shapeInfo = await uploadFiles(files);

    if (shapeInfo.shape === ImageShapeEnum.HyperStackImage) {
      setImageShape(shapeInfo);
      setFiles(files);
    } else {
      onCloseMenu();
    }
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
      {files?.length && (
        <ImageShapeDialog
          files={files}
          open={openDimensionsDialogBox}
          onClose={() => {
            setOpenDimensionsDialogBox(false);
            onCloseMenu();
          }}
          referenceImageShape={imageShape}
        />
      )}
    </React.Fragment>
  );
};
