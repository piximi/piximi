import { Box } from "@mui/material";
import { ImageShapeDialog } from "components/dialogs";
import { useDndFileDrop, useUpload } from "hooks";
import React, { ReactElement, useCallback, useState } from "react";
import { ImageShapeEnum, ImageShapeInfo } from "utils/common/image";

export const DropBox = ({ children }: { children: ReactElement }) => {
  const [imageShape, setImageShape] = useState<ImageShapeInfo>({
    shape: ImageShapeEnum.InvalidImage,
  });
  const [files, setFiles] = useState<FileList>();
  const [openDimensionsDialogBox, setOpenDimensionsDialogBox] = useState(false);

  const uploadFiles = useUpload(setOpenDimensionsDialogBox, false);

  const handleCloseDimensionsDialog = () => {
    setOpenDimensionsDialogBox(false);
  };

  const handleDrop = useCallback(
    async (files: FileList) => {
      const imageShapeInfo = await uploadFiles(files);
      setImageShape(imageShapeInfo);
      setFiles(files);
    },
    [uploadFiles]
  );
  const [{ isOver }, dropTarget] = useDndFileDrop(handleDrop);
  return (
    <>
      <Box
        component="main"
        ref={dropTarget}
        sx={(theme) => ({
          transition: theme.transitions.create("margin", {
            duration: theme.transitions.duration.enteringScreen,
            easing: theme.transitions.easing.easeOut,
          }),
          border: isOver ? "5px solid blue" : "",
          height: "calc(100vh - 64px - 49px)",
        })}
      >
        {children}
      </Box>
      {files?.length && (
        <ImageShapeDialog
          files={files}
          open={openDimensionsDialogBox}
          onClose={handleCloseDimensionsDialog}
          isUploadedFromAnnotator={false}
          referenceImageShape={imageShape}
        />
      )}
    </>
  );
};
