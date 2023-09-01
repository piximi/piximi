import { Grid, Typography } from "@mui/material";

import { ShuffleForm } from "components/forms/ShuffleForm";
import { CustomNumberTextField, StyledFormControl } from "components/forms";
import { CollapsibleListItem } from "../CollapsibleListItem";

type DatasetSettingsListItemProps = {
  trainingPercentage: number;
  dispatchTrainingPercentageCallback: (trainPercentage: number) => void;
  isModelTrainable: boolean;
};

export const DatasetSettingsListItem = ({
  trainingPercentage,
  dispatchTrainingPercentageCallback,
  isModelTrainable,
}: DatasetSettingsListItemProps) => {
  const dispatchTrainingPercentage = (trainPercentage: number) => {
    dispatchTrainingPercentageCallback(trainPercentage);
  };

  return (
    <CollapsibleListItem
      primaryText="Dataset Settings"
      carotPosition="start"
      divider={true}
    >
      <StyledFormControl>
        <Typography id="range-slider" gutterBottom>
          What fraction of the labeled images should be used for training? (The
          rest is used for validation)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <CustomNumberTextField
              id="test-split"
              label="Train percentage"
              value={trainingPercentage}
              dispatchCallBack={dispatchTrainingPercentage}
              min={0}
              max={1}
              enableFloat={true}
              disabled={!isModelTrainable}
            />
          </Grid>
        </Grid>
      </StyledFormControl>
      <ShuffleForm isModelTrainable={isModelTrainable} />
    </CollapsibleListItem>
  );
};
