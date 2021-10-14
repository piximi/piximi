import {
  Button,
  Collapse,
  Grid,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Tooltip,
} from "@material-ui/core";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import * as React from "react";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import { useState } from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { useDispatch, useSelector } from "react-redux";
import { testPercentageSelector } from "../../../store/selectors/testPercentageSelector";
import { trainingPercentageSelector } from "../../../store/selectors";
import { classifierSlice } from "../../../store/slices";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
      // marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      flexBasis: 300,
      width: "100%",
    },
  })
);

export const DatasetSettingsListItem = () => {
  const classes = useStyles();

  // assign each image to train- test- or validation- set
  const initializeDatasets = () => {
    //FIXME bring that back
    // if (datasetInitialized) {
    //   return;
    // }
    // var partitions: number[] = [];
    // images.forEach((image: Images) => {
    //   const setItentifier = assignToSet();
    //   partitions.push(setItentifier);
    // });
    // // setImagesPartition(partitions);
    // setDatasetInitialized(true);
  };

  function valuetext(value: any) {
    return `${value}%`;
  }

  const dispatch = useDispatch();

  const [collapsedDatasetSettingsList, setCollapsedDatasetSettingsList] =
    useState<boolean>(false);

  const onDatasetSettingsListClick = () => {
    setCollapsedDatasetSettingsList(!collapsedDatasetSettingsList);
  };

  const testPercentage = useSelector(testPercentageSelector);
  const trainingPercentage = useSelector(trainingPercentageSelector);

  const onTestPercentageChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const testPercentage = Number(target.value);
    dispatch(
      classifierSlice.actions.updateTestPercentage({
        testPercentage: testPercentage,
      })
    );
  };

  const onTrainPercentageChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const trainPercentage = Number(target.value);
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
        <div style={{ padding: "12px 0px", width: "300" }}>
          <Typography id="range-slider" gutterBottom>
            How much data should go to test set?
          </Typography>

          <Grid item xs={2}>
            <TextField
              id="test-split"
              label="Test percentage (%)"
              className={classes.textField}
              value={testPercentage}
              margin="normal"
              onChange={onTestPercentageChange}
            />
          </Grid>
        </div>
        <div style={{ padding: "12px 0px", width: "300" }}>
          <Typography id="range-slider" gutterBottom>
            How much of the left dataset should be used for training? (and the
            rest for validation)
          </Typography>
          <Grid item xs={2}>
            <TextField
              id="test-split"
              label="Train percentage (%)"
              className={classes.textField}
              value={trainingPercentage}
              margin="normal"
              onChange={onTrainPercentageChange}
            />
          </Grid>
        </div>
        <Tooltip title="Initialize dataset" placement="bottom">
          <Button
            variant="contained"
            color="primary"
            onClick={() => {}} //TODO implement this (see initalizeDataset function)
          >
            Initialize Dataset
          </Button>
        </Tooltip>
      </Collapse>
    </>
  );
};
