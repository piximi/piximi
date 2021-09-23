import React from "react";
import Dialog from "@material-ui/core/Dialog";
import { ClassifierSettingsDialogContent } from "../ClassifierSettingsDialogContent";
import { ClassifierSettingsDialogAppBar } from "../ClassifierSettingsDialogAppBar";

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
      <ClassifierSettingsDialogAppBar onClose={onClose} />

      <ClassifierSettingsDialogContent />
    </Dialog>
  );
};
