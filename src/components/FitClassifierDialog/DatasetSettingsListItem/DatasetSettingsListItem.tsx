import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Collapse,
  Grid,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import { StyledFormControl } from "../StyledFormControl";

import { CustomNumberTextField } from "components/common/CustomNumberTextField/CustomNumberTextField";

import { trainingPercentageSelector } from "store/selectors";

import { classifierSlice } from "store/slices";

export const DatasetSettingsListItem = () => {
  const dispatch = useDispatch();

  const [collapsedDatasetSettingsList, setCollapsedDatasetSettingsList] =
    useState<boolean>(false);

  const onDatasetSettingsListClick = () => {
    setCollapsedDatasetSettingsList(!collapsedDatasetSettingsList);
  };

  const trainingPercentage = useSelector(trainingPercentageSelector);

  const dispatchTrainingPercentage = (trainPercentage: number) => {
    dispatch(
      classifierSlice.actions.updateTrainingPercentage({
        trainingPercentage: trainPercentage,
      })
    );
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
