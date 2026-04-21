import React, { ReactElement } from "react";
import { Box } from "@mui/material";

import { useDndFileDrop, useFileLoader } from "hooks";

import { useFileUploadContext } from "contexts";
import { TiffConfigDialog } from "components/dialogs";

export const DropBox = ({ children }: { children: ReactElement }) => {
  const uploadFiles = useFileUploadContext();
  const {
    upload,
    tiffDialogOpen,
    pendingTiffAnalysis,
    handleTiffDialog,
    handleConfirmTiffConfig,
    handleCancelTiffConfig,
  } = useFileLoader();

  const handleDrop = async (files: FileList) => {
    if (import.meta.env.VITE_USE_V2 === "true") {
      await upload(files, { onTiffDialog: handleTiffDialog });
    } else {
      if (uploadFiles) {
        await uploadFiles(files);
      }
    }
  };
  const [{ isOver }, dropTarget] = useDndFileDrop(handleDrop);
  return (
    <>
      <Box
        ref={dropTarget}
        sx={(theme) => ({
          transition: theme.transitions.create("margin", {
            duration: theme.transitions.duration.enteringScreen,
            easing: theme.transitions.easing.easeOut,
          }),
          border: isOver ? "5px solid blue" : "",
          height: "100%",
        })}
      >
        {children}
      </Box>
      {import.meta.env.VITE_USE_V2 === "true" &&
        pendingTiffAnalysis !== null && (
          <TiffConfigDialog
            open={tiffDialogOpen}
            analysisResult={pendingTiffAnalysis}
            onCancel={handleCancelTiffConfig}
            onConfirm={handleConfirmTiffConfig}
          />
        )}
    </>
  );
};
