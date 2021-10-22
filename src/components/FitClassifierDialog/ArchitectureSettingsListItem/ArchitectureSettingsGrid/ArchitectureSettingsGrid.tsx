import {
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import * as _ from "lodash";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../../../store/slices";
import { architectureOptionsSelector } from "../../../../store/selectors/architectureOptionsSelector";
import { inputShapeSelector } from "../../../../store/selectors/inputShapeSelector";
import { useStyles } from "../../FitClassifierDialog/FitClassifierDialog.css";

const modelArchitecture = {
  SimpleCNN: "SimpleCNN",
  ResNet: "ResNet",
};

export const ArchitectureSettingsGrid = () => {
  const architectureOptions = useSelector(architectureOptionsSelector);
  const inputShape = useSelector(inputShapeSelector);

  const dispatch = useDispatch();

  const classes = useStyles();

  const onModelNameChange = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement;
    dispatch(
      classifierSlice.actions.updateModelName({ modelName: target.value })
    );
  };

  const onRowsChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const rows = Number(target.value);
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, r: rows },
      })
    );
  };
  const onColsChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const cols = Number(target.value);
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, c: cols },
      })
    );
  };
  const onChannelsChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const channels = Number(target.value);
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, channels: channels },
      })
    );
  };

  return (
    <>
      <FormControl className={classes.container} sx={{ m: 1, minWidth: 120 }}>
        <Grid container spacing={2}>
          <Grid item xs={2}>
            <FormHelperText>Model name</FormHelperText>
            <Select
              value={architectureOptions.modelName}
              onChange={onModelNameChange}
              className={classes.select}
              displayEmpty
              inputProps={{ "aria-label": "Without label" }}
            >
              {_.map(modelArchitecture, (v, k) => {
                return (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                );
              })}
            </Select>
          </Grid>
        </Grid>
        <Grid container direction={"row"} spacing={2}>
          <Grid item xs={1}>
            <TextField
              id="shape-rows"
              label="Input rows"
              className={classes.textField}
              value={inputShape.r}
              onChange={onRowsChange}
            />
          </Grid>
          <Grid item xs={1}>
            <TextField
              id="shape-cols"
              label="Input cols"
              className={classes.textField}
              value={inputShape.c}
              onChange={onColsChange}
            />
          </Grid>
          <Grid item xs={1}>
            <TextField
              id="shape-channels"
              label="Input channels"
              className={classes.textField}
              value={inputShape.channels}
              onChange={onChannelsChange}
            />
          </Grid>
        </Grid>
      </FormControl>
    </>
  );
};
