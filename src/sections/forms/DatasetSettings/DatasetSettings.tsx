import { Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import React from "react";
import { CustomNumberTextField } from "../../../components/CustomNumberTextField";

export const DatasetSettings = ({
  trainingPercentage,
  dispatchTrainingPercentage,
  isModelTrainable,
  shuffleOptions,
  toggleShuffleOptions,
}: {
  trainingPercentage: number;
  dispatchTrainingPercentage: (trainingPercentage: number) => void;
  isModelTrainable: boolean;
  shuffleOptions: boolean;
  toggleShuffleOptions: () => void;
}) => {
  return (
    <Stack>
      <Typography variant="body2" gutterBottom>
        What fraction of the labeled images should be used for training? (The
        rest is used for validation)
      </Typography>
      <CustomNumberTextField
        id="test-split"
        label="Train percentage"
        value={trainingPercentage}
        dispatchCallBack={dispatchTrainingPercentage}
        min={0}
        max={1}
        enableFloat={true}
        disabled={!isModelTrainable}
        width="15ch"
      />
      <Typography variant="body2" gutterBottom>
        Training/Validation Data Shuffling
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={shuffleOptions}
            onChange={toggleShuffleOptions}
            color="primary"
            disabled={!isModelTrainable}
          />
        }
        label="Shuffle on Split"
      />
    </Stack>
  );
};
