// TODO: implement segmenter serialization
import { ChangeEvent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveAs } from "file-saver";
import { Grid, TextField } from "@mui/material";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import { applicationSettingsSlice } from "store/applicationSettings";
import { selectProject } from "store/project/selectors";
import { selectClassifier } from "store/classifier/selectors";
import { selectSegmenter } from "store/segmenter/selectors";
import { selectDataProject } from "store/data/selectors";

import { serializeProject } from "utils/file-io/serialize";
import { logger } from "utils/common/helpers";

import { AlertType } from "utils/common/enums";

import { AlertState } from "utils/common/types";

type SaveProjectDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const SaveProjectDialog = ({
  onClose,
  open,
}: SaveProjectDialogProps) => {
  const dispatch = useDispatch();

  const classifier = useSelector(selectClassifier);
  const segmenter = useSelector(selectSegmenter);

  const project = useSelector(selectProject);
  const data = useSelector(selectDataProject);

  const [projectName, setProjectName] = useState<string>(project.name);

  const onLoadProgress = (loadPercent: number, loadMessage: string) => {
    dispatch(
      applicationSettingsSlice.actions.sendLoadPercent({
        loadPercent,
        loadMessage,
      })
    );
  };

  const onSaveProjectClick = async () => {
    serializeProject(
      projectName,
      project,
      data,
      classifier,
      segmenter,
      onLoadProgress
    )
      .then((zip) => {
        return zip.generateAsync(
          {
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: { level: 4 },
          },
          // onUpdate callback
          (meta: { percent: number }) => {
            onLoadProgress(
              meta.percent / 100,
              `compressing ${meta.percent.toFixed(2)}%`
            );
            // process.env.REACT_APP_LOG_LEVEL === "1" &&
            logger(`zipping %${Math.floor(meta.percent)}`);
          }
        );
      })
      .then((blob) => {
        onLoadProgress(-1, "saving project...");
        saveAs(blob, `${projectName}.zip`);
        // don't use onLoadProgress here, it may be sleeping
        // and ignoring updates; this *must* go through
        dispatch(
          applicationSettingsSlice.actions.setLoadPercent({ loadPercent: 1 })
        );
      })
      .catch((err: Error) => {
        process.env.REACT_APP_LOG_LEVEL === "1" && console.error(err);

        process.env.NODE_ENV !== "production" &&
          process.env.REACT_APP_LOG_LEVEL === "1" &&
          console.error(err);
        const warning: AlertState = {
          alertType: AlertType.Warning,
          name: "Could not parse project file",
          description: `Error while parsing the project file: ${err.name}\n${err.message}`,
        };

        dispatch(
          applicationSettingsSlice.actions.updateAlertState({
            alertState: warning,
          })
        );
      });

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
