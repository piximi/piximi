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

import { annotatorFullImagesSelector } from "store/common";
import { HotkeyView } from "types";
import { serializeProject } from "utils/annotator/file-io/serializeProject";
import { annotationCategoriesSelector } from "store/project";

type SaveAnnotationProjectDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SaveAnnotationProjectDialog = ({
  onClose,
  open,
}: SaveAnnotationProjectDialogProps) => {
  const [projectName, setProjectName] = useState<string>("");

  const fullImages = useSelector(annotatorFullImagesSelector);
  const categories = useSelector(annotationCategoriesSelector);

  const onSaveAllAnnotations = () => {
    const serializedProject = serializeProject(fullImages, categories);

    const data = new Blob([JSON.stringify(serializedProject)], {
      type: "application/json;charset=utf-8",
    });

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
