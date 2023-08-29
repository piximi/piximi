import React, { useState } from "react";

import { ListItemText, MenuItem } from "@mui/material";

import { useUpload } from "hooks";

import { ImageShapeDialog } from "components/dialogs";
import { ImageShapeEnum, ImageShapeInfo } from "utils/common/image";

type OpenImageMenuItemProps = {
  onCloseMenu: () => void;
};

export const OpenImageMenuItem = ({ onCloseMenu }: OpenImageMenuItemProps) => {
  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);

  const [imageShape, setImageShape] = useState<ImageShapeInfo>({
    shape: ImageShapeEnum.InvalidImage,
  });

  const [files, setFiles] = React.useState<FileList>();

  const uploadFiles = useUpload(setOpenDimensionsDialogBox, true);
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
          referenceImageShape={imageShape}
        />
      )}
    </React.Fragment>
  );
};
