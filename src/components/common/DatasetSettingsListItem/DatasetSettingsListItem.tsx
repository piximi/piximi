import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  Collapse,
  Grid,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { CustomNumberTextField } from "../CustomNumberTextField/CustomNumberTextField";
import { StyledFormControl } from "../../FitClassifierDialog/StyledFormControl";

type DatasetSettingsListItemProps = {
  trainingPercentage: number;
  dispatchTrainingPercentageCallback: (trainPercentage: number) => void;
};

export const DatasetSettingsListItem = ({
  trainingPercentage,
  dispatchTrainingPercentageCallback,
}: DatasetSettingsListItemProps) => {
  const [collapsedDatasetSettingsList, setCollapsedDatasetSettingsList] =
    useState<boolean>(false);

  const onDatasetSettingsListClick = () => {
    setCollapsedDatasetSettingsList(!collapsedDatasetSettingsList);
  };

  const dispatchTrainingPercentage = (trainPercentage: number) => {
    dispatchTrainingPercentageCallback(trainPercentage);
  };

  return (
    <>
      <ListItem
        button
        onClick={onDatasetSettingsListClick}
        style={{ padding: "12px 0px" }}
      >
        <ListItemIcon>
          {collapsedDatasetSettingsList ? (
            <ExpandLessIcon />
          ) : (
            <ExpandMoreIcon />
          )}
        </ListItemIcon>

        <ListItemText primary="Dataset Settings" style={{ fontSize: "1em" }} />
      </ListItem>
      <Collapse in={collapsedDatasetSettingsList} timeout="auto" unmountOnExit>
        <StyledFormControl>
          <Typography id="range-slider" gutterBottom>
            What fraction of the labeled images should be used for training?
            (The rest is used for validation)
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
      </Collapse>
    </>
  );
};
