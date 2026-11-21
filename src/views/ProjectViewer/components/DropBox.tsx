import { Box } from "@mui/material";

import { useCapability } from "core/backend";

import { useDndFileDrop, useFileLoader } from "hooks";

import { TiffConfigDialog } from "./dialogs/tiff-config/TiffConfigDialog";

import type { ReactElement } from "react";

export const DropBox = ({ children }: { children: ReactElement }) => {
  const {
    upload,
    tiffDialogOpen,
    pendingTiffAnalysis,
    handleConfirmTiffConfig,
    handleCancelTiffConfig,
  } = useFileLoader();

  // Only a backend that takes uploads accepts a drop.
  const canUpload = useCapability("ingest.upload");
  const handleDrop = async (files: FileList) => {
    if (canUpload) await upload(Array.from(files));
  };
  const [{ isOver }, dropTarget] = useDndFileDrop(handleDrop);
  return (
    <>
      <Box
        ref={(el: HTMLElement | null) => {
          dropTarget(el);
        }}
        sx={(theme) => ({
          transition: theme.transitions.create("margin", {
            duration: theme.transitions.duration.enteringScreen,
            easing: theme.transitions.easing.easeOut,
          }),
          border: isOver && canUpload ? "5px solid blue" : "",
          height: "100%",
        })}
      >
        {children}
      </Box>
      {pendingTiffAnalysis !== null && (
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
