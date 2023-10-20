import React, { ChangeEvent } from "react";
import { useDispatch } from "react-redux";
import { useHotkeys } from "hooks";

import { TextField } from "@mui/material";

import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";
import { HotkeyView } from "types";
import { dataSlice } from "store/data";
import { DialogWithAction } from "../DialogWithAction";

type NewProjectDialogProps = {
  onClose: () => void;
  open: boolean;
};

// TODO: Should alert since data will be deleted
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
    dispatch(
      dataSlice.actions.initData({
        images: [],
        annotations: [],
        categories: [],
        annotationCategories: [],
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

  useHotkeys(
    "enter",
    () => onCreateNewProject(),
    HotkeyView.NewProjectDialog,
    { enableOnTags: ["INPUT"] },
    [onCreateNewProject]
  );

  return (
    <DialogWithAction
      onClose={closeDialog}
      isOpen={open}
      title="New Project"
      content={
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
      }
      onConfirm={onCreateNewProject}
      confirmText="Create"
    />
  );
};
