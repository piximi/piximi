import React, { ReactElement } from "react";
import { Box } from "@mui/material";
import { useFileUpload } from "contexts/FileUploadContext";
import { useDndFileDrop } from "hooks";

export const DropBox = ({ children }: { children: ReactElement }) => {
  const uploadFiles = useFileUpload();

  const handleDrop = async (files: FileList) => {
    if (uploadFiles) {
      await uploadFiles(files);
    }
  };
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
    </>
  );
};
