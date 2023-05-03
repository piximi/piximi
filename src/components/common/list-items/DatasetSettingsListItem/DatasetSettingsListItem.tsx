import { Grid, Typography } from "@mui/material";

import { ShuffleForm } from "./ShuffleForm";
import {
  CollapsibleList,
  CustomNumberTextField,
  StyledFormControl,
} from "../../styled-components";

type DatasetSettingsListItemProps = {
  trainingPercentage: number;
  dispatchTrainingPercentageCallback: (trainPercentage: number) => void;
  isModelPretrained?: boolean;
};

export const DatasetSettingsListItem = ({
  trainingPercentage,
  dispatchTrainingPercentageCallback,
  isModelPretrained,
}: DatasetSettingsListItemProps) => {
  const dispatchTrainingPercentage = (trainPercentage: number) => {
    dispatchTrainingPercentageCallback(trainPercentage);
  };

  return (
    <CollapsibleList
      dense={false}
      primary="Dataset Settings"
      disablePadding={false}
      paddingLeft={true}
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
              disabled={isModelPretrained}
            />
          </Grid>
        </Grid>
      </StyledFormControl>
      <ShuffleForm isModelPretrained={isModelPretrained} />
    </CollapsibleList>
  );
};
