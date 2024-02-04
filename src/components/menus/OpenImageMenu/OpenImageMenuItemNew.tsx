import React, { useState } from "react";

import { ListItemText, MenuItem } from "@mui/material";

import { useUpload } from "hooks";

import { ImageShapeEnum, ImageShapeInfo } from "utils/common/image";
import { ImageShapeDialogNew } from "components/dialogs/ImageShapeDialog/ImageShapeDialogNew";

//TODO: MenuItem??

type OpenImageMenuItemProps = {
  onCloseMenu: () => void;
};

export const OpenImageMenuItemNew = ({
  onCloseMenu,
}: OpenImageMenuItemProps) => {
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
        <ImageShapeDialogNew
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
