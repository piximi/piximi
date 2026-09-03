import type { ChangeEvent } from "react";
import { useState } from "react";

import { useSelector } from "react-redux";

import { Grid2 as Grid, TextField } from "@mui/material";

import { useProjectSaver } from "hooks";

import { selectExperiment } from "store/data/selectors";

import { ConfirmationDialog } from "./ConfirmationDialog";

type SaveProjectDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SaveProjectDialog = ({
  onClose,
  open,
}: SaveProjectDialogProps) => {
  const experiment = useSelector(selectExperiment);
  const [experimentName, setExperimentName] = useState<string>(experiment.name);
  const { saveProject } = useProjectSaver();

  const onSaveProjectClick = async () => {
    // Close first: the save reports progress through the AppTask tray, so
    // holding the dialog open would just block the view of it.
    onClose();
    await saveProject(experimentName.trim() || experiment.name);
  };

  const onCancel = () => {
    onClose();
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setExperimentName(event.target.value);
  };

  return (
    <ConfirmationDialog
      isOpen={open}
      onClose={onCancel}
      title="Save Project"
      content={
        <Grid container spacing={1}>
          <Grid size={{ xs: 10 }}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              label="Project file name"
              margin="dense"
              variant="standard"
              value={experimentName}
              onChange={onNameChange}
            />
          </Grid>
        </Grid>
      }
      onConfirm={onSaveProjectClick}
      confirmText="Save Project"
    />
  );
};
