import { ChangeEvent, useState } from "react";
import { useSelector } from "react-redux";
import saveAs from "file-saver";
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

import { classifierSelector, serializedProjectSelector } from "store/selectors";
import { segmenterSelector } from "store/selectors/segmenter";

type SaveProjectDialogProps = {
  onClose: () => void;
  open: boolean;
  popupState: any;
};

export const SaveProjectDialog = ({
  onClose,
  open,
  popupState,
}: SaveProjectDialogProps) => {
  const classifier = useSelector(classifierSelector);

  const segmenter = useSelector(segmenterSelector);

  const serializedProject = useSelector(serializedProjectSelector);

  const [projectName, setProjectName] = useState<string>(
    serializedProject.name
  );

  const onSaveProjectClick = () => {
    const part = {
      classifier: classifier,
      segmenter: segmenter,
      project: serializedProject,
      version: "0.0.0",
    };

    part.project.name = projectName;

    const parts = [JSON.stringify(part)];

    const data = new Blob(parts, { type: "application/json;charset=utf-8" });

    saveAs(data, `${projectName}.json`);

    onClose();
    popupState.close();
  };

  const onCancel = () => {
    onClose();
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProjectName(event.target.value);
  };

  useHotkeys(
    "enter",
    () => {
      onSaveProjectClick();
    },
    { enabled: open },
    [onSaveProjectClick]
  );

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle>Save Project</DialogTitle>

      <DialogContent>
        <Grid container spacing={1}>
          <Grid item xs={10}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              label="Project file name"
              margin="dense"
              value={projectName}
              onChange={onNameChange}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>

        <Button onClick={onSaveProjectClick} color="primary">
          Save Project
        </Button>
      </DialogActions>
    </Dialog>
  );
};
