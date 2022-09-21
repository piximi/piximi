import React, { ChangeEvent } from "react";
import { useDispatch } from "react-redux";
import { useHotkeys } from "hooks";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";
import { HotkeyView } from "types";

type NewProjectDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const NewProjectDialog = ({ onClose, open }: NewProjectDialogProps) => {
  const dispatch = useDispatch();

  const [projectName, setProjectName] =
    React.useState<string>("Untitled project");
  const [invalidProjectName, setInvalidProjectName] =
    React.useState<boolean>(false);

  const onCreateNewProject = () => {
    if (invalidProjectName) {
      return;
    }

    dispatch(
      projectSlice.actions.createNewProject({
        name: projectName,
      })
    );

    dispatch(classifierSlice.actions.resetClassifier());

    closeDialog();
  };

  const onChangeClassifierName = (event: ChangeEvent<HTMLInputElement>) => {
    const newProjectName = event.target.value;

    setProjectName(newProjectName);

    if (newProjectName === "") {
      setInvalidProjectName(true);
    } else {
      setInvalidProjectName(false);
    }
  };

  const closeDialog = () => {
    setProjectName("Untitled project");
    setInvalidProjectName(false);
    onClose();
  };

  useHotkeys("enter", () => onCreateNewProject(), HotkeyView.NewProjectDialog, [
    onCreateNewProject,
  ]);

  return (
    <Dialog fullWidth maxWidth={"xs"} onClose={closeDialog} open={open}>
      <DialogTitle>New project</DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          id="name"
          label="Name"
          margin="dense"
          value={projectName}
          onChange={onChangeClassifierName}
          error={invalidProjectName}
          helperText={invalidProjectName ? "Provide a project name" : ""}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={closeDialog} color="primary">
          Cancel
        </Button>
        <Button onClick={onCreateNewProject} color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};
