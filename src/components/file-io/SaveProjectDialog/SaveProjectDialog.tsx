import { ChangeEvent, useState } from "react";
import { useSelector } from "react-redux";
import h5wasm from "h5wasm";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";

import { classifierSelector } from "store/classifier";
import { projectSelector } from "store/project";
// TODO: implement segmenter serialization
// import { segmenterSelector } from "store/segmenter";

import { useHotkeys } from "hooks";
import { download } from "components/file-io/utils/file_handlers";
import { serialize } from "image/utils/serialize";

import { HotkeyView } from "types";

type SaveProjectDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SaveProjectDialog = ({
  onClose,
  open,
}: SaveProjectDialogProps) => {
  const classifier = useSelector(classifierSelector);

  const project = useSelector(projectSelector);

  const [projectName, setProjectName] = useState<string>(project.name);

  const onSaveProjectClick = async () => {
    await h5wasm.ready;

    const f = new h5wasm.File(`${project.name}.h5`, "w");

    serialize(f, project, classifier);

    await download(f);
    const closeStatus = f.close();

    process.env.REACT_APP_LOG_LEVEL === "1" &&
      console.log(`closed ${project.name} with status ${closeStatus}`);

    onClose();
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
    HotkeyView.SaveProjectDialog,
    { enableOnTags: ["INPUT"] },
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
