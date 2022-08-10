import React, { ChangeEvent, useState } from "react";
import { useSelector } from "react-redux";
import { saveAs } from "file-saver";
import { useHotkeys } from "react-hotkeys-hook";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";

import { allSerializedAnnotationsSelector } from "store/selectors";

type SaveAnnotationProjectDialogProps = {
  onClose: () => void;
  open: boolean;
  popupState: any;
};

export const SaveAnnotationProjectDialog = ({
  onClose,
  open,
  popupState,
}: SaveAnnotationProjectDialogProps) => {
  const [projectName, setProjectName] = useState<string>("");

  const serializedProject = useSelector(allSerializedAnnotationsSelector);

  const onSaveAllAnnotations = () => {
    const parts = [JSON.stringify(serializedProject)];

    const data = new Blob(parts, { type: "application/json;charset=utf-8" });

    saveAs(data, `${projectName}.json`);

    setProjectName("");
    onClose();
    popupState.close();
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
    { enabled: open },
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
