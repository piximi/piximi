import { Grid, Typography } from "@mui/material";

import { ShuffleForm } from "./ShuffleForm";
import { CustomNumberTextField } from "../InputFields";
import { StyledFormControl } from "../StyledFormControl";

import { CollapsibleList } from "../CollapsibleList";

type DatasetSettingsListItemProps = {
  trainingPercentage: number;
  dispatchTrainingPercentageCallback: (trainPercentage: number) => void;
};

export const DatasetSettingsListItem = ({
  trainingPercentage,
  dispatchTrainingPercentageCallback,
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
            />
          </Grid>
        </Grid>
      </StyledFormControl>
      <ShuffleForm />
    </CollapsibleList>
  );
};
