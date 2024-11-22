import React, { ChangeEvent } from "react";
import { useDispatch } from "react-redux";
import { TextField } from "@mui/material";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";
import { dataSlice } from "store/data/dataSlice";
import { annotatorSlice } from "store/annotator";
import { imageViewerSlice } from "store/imageViewer";
import { segmenterSlice } from "store/segmenter";
import { measurementsSlice } from "store/measurements";

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
    dispatch(dataSlice.actions.resetData());
    dispatch(classifierSlice.actions.resetClassifier());
    dispatch(annotatorSlice.actions.resetAnnotator());
    dispatch(imageViewerSlice.actions.resetImageViewer());
    dispatch(measurementsSlice.actions.resetMeasurements());
    dispatch(segmenterSlice.actions.resetSegmenter());
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

  return (
    <ConfirmationDialog
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
          variant="standard"
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
