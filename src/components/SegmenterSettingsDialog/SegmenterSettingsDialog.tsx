import React from "react";
import Dialog from "@material-ui/core/Dialog";
import { ClassifierSettingsDialogContent } from "../ClassifierSettingsDialogContent";
import { SegmenterSettingsDialogAppBar } from "../SegmenterSettingsDialogAppBar";

type ClassifierSettingsDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SegmenterSettingsDialog = ({
  onClose,
  open,
}: ClassifierSettingsDialogProps) => {
  return (
    <Dialog fullScreen onClose={onClose} open={open}>
      <SegmenterSettingsDialogAppBar onClose={onClose} />

      <ClassifierSettingsDialogContent />
    </Dialog>
  );
};
