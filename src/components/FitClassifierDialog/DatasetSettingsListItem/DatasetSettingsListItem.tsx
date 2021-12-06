import { useState } from "react";
import { createStyles, makeStyles } from "@mui/styles";
import { useDispatch, useSelector } from "react-redux";
import { trainingPercentageSelector } from "../../../store/selectors";
import { classifierSlice } from "../../../store/slices";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  Collapse,
  Grid,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Theme,
  Typography,
} from "@mui/material";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
      marginRight: theme.spacing(1),
      flexBasis: 300,
      width: "100%",
    },
  })
);

export const DatasetSettingsListItem = () => {
  const classes = useStyles();

  const dispatch = useDispatch();

  const [collapsedDatasetSettingsList, setCollapsedDatasetSettingsList] =
    useState<boolean>(false);

  const onDatasetSettingsListClick = () => {
    setCollapsedDatasetSettingsList(!collapsedDatasetSettingsList);
  };

  const trainingPercentage = useSelector(trainingPercentageSelector);

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
            What fraction of the labeled images should be used for training?
            (The rest is used for validation)
          </Typography>
          <Grid item xs={2}>
            <TextField
              id="test-split"
              label="Train percentage"
              className={classes.textField}
              value={trainingPercentage}
              margin="normal"
              onChange={onTrainPercentageChange}
              type="number"
              inputProps={{ min: 0, max: 1, step: 0.01 }}
            />
          </Grid>
        </div>
      </Collapse>
    </>
  );
};
