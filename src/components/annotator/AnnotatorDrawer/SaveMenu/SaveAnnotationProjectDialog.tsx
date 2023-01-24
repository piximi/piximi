import React, { ChangeEvent, useState } from "react";
import { useSelector } from "react-redux";
import { saveAs } from "file-saver";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";

import { useHotkeys } from "hooks";

import { activeSerializedAnnotationsSelector } from "store/common";
import { HotkeyView } from "types";

type SaveAnnotationProjectDialogProps = {
  onClose: () => void;
  open: boolean;
};

// TODO: post PR #407 - refactor project file (SerializedFileType) to host
// annotations for all images in viewer, rather than just the active one
export const SaveAnnotationProjectDialog = ({
  onClose,
  open,
}: SaveAnnotationProjectDialogProps) => {
  const [projectName, setProjectName] = useState<string>("");

  const serializedProject = useSelector(activeSerializedAnnotationsSelector);

  const onSaveAllAnnotations = () => {
    const parts = [JSON.stringify(serializedProject)];

    const data = new Blob(parts, { type: "application/json;charset=utf-8" });

    saveAs(data, `${projectName}.json`);

    setProjectName("");
    onClose();
  };

  const onCancel = () => {
    setProjectName("");
    onClose();
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProjectName(event.target.value);
  };

  useHotkeys(
    "enter",
    () => {
      onSaveAllAnnotations();
    },
    HotkeyView.SaveAnnotationProjectDialog,
    { enableOnTags: ["INPUT"] },
    [onSaveAllAnnotations]
  );

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle>Save Annotation Project</DialogTitle>

      <DialogContent>
        <Grid container spacing={1}>
          <Grid item xs={10}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              label="Project file name"
              margin="dense"
              onChange={onNameChange}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>

        <Button onClick={onSaveAllAnnotations} color="primary">
          Save Annotation Project
        </Button>
      </DialogActions>
    </Dialog>
  );
};
