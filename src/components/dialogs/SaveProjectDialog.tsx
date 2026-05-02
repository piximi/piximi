// TODO: implement segmenter serialization
import { ChangeEvent, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Grid, TextField } from "@mui/material";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import { selectProject } from "store/project/selectors";

type SaveProjectDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SaveProjectDialog = ({
  onClose,
  open,
}: SaveProjectDialogProps) => {
  const project = useSelector(selectProject);

  const [projectName, setProjectName] = useState<string>(project.name);

  const onSaveProjectClick = async () => {
    alert("Not yet implemented");

    onClose();
  };

  const onCancel = () => {
    onClose();
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProjectName(event.target.value);
  };
  useEffect(() => {
    setProjectName(project.name);
  }, [project.name]);

  return (
    <ConfirmationDialog
      isOpen={open}
      onClose={onCancel}
      title="Save Project"
      content={
        <Grid container spacing={1}>
          <Grid item xs={10}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              label="Project file name"
              margin="dense"
              variant="standard"
              value={projectName}
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
