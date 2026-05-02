import React, { ReactElement } from "react";
import { Box } from "@mui/material";

import { useDndFileDrop, useFileLoader } from "hooks";

import { TiffConfigDialog } from "components/dialogs";

export const DropBox = ({ children }: { children: ReactElement }) => {
  const {
    upload,
    tiffDialogOpen,
    pendingTiffAnalysis,
    handleTiffDialog,
    handleConfirmTiffConfig,
    handleCancelTiffConfig,
  } = useFileLoader();

  const handleDrop = async (files: FileList) => {
    await upload(files, { onTiffDialog: handleTiffDialog });
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
