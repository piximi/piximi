import type { ChangeEvent } from "react";
import { useState } from "react";

import { useSelector } from "react-redux";

import { saveAs } from "file-saver";

import { Grid2 as Grid, TextField } from "@mui/material";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectRunsForActiveModel } from "store/classifier/selectors";

import type { ModelInfoDTO } from "utils/dl/classification/types";
import { useClassifierApi } from "utils/dl/classification";
import { buildClassifierZip } from "utils/file-io/export/exportFittedModel";

import { ConfirmationDialog } from "../../../../components/dialogs/ConfirmationDialog";

type SaveFittedModelDialogProps = {
  model: ModelInfoDTO;
  onClose: () => void;
  open: boolean;
};

export const SaveFittedModelDialog = ({
  model,
  onClose,
  open,
}: SaveFittedModelDialogProps) => {
  const [name, setName] = useState<string>(model.name);
  const noNameError = name.length === 0;
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const runs = useParameterizedSelector(selectRunsForActiveModel, modelTarget);

  const cfApi = useClassifierApi();
  const onSaveClassifierClick = async () => {
    const result = await cfApi.getSavedModelData(name);
    if (result.success) {
      const { modelJson, modelWeights } = result.data;
      const zipBlob = await buildClassifierZip(
        { modelJson: modelJson.blob, modelWeights: modelWeights.blob },
        runs,
        { modelName: noNameError ? model.name : name },
      );

      saveAs(zipBlob, `${noNameError ? model.name : name}.zip`);
    } else {
      console.error(
        `[SaveFittedModelDialog] ${result.reason.code}: ${result.reason.message}`,
        result.reason.cause,
      );
    }
    onClose();
  };

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  return (
    <ConfirmationDialog
      isOpen={open}
      onClose={onClose}
      title={`Save ${model.name}`}
      content={
        <Grid container spacing={1}>
          <Grid size={{ xs: 10 }}>
            <TextField
              autoFocus
              fullWidth
              id="name"
              label="Model Name"
              value={name}
              margin="dense"
              variant="standard"
              onChange={onNameChange}
              helperText={
                noNameError
                  ? `No name given. Default name ${model.name} will be used.`
                  : ""
              }
              error={noNameError}
            />
          </Grid>
        </Grid>
      }
      onConfirm={onSaveClassifierClick}
      confirmText="Save"
    />
  );
};
