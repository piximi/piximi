import React from "react";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import { useStyles } from "./index.css";
import Container from "@material-ui/core/Container";
import DialogContent from "@material-ui/core/DialogContent";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import { useDispatch, useSelector } from "react-redux";
import { LossFunction, OptimizationAlgorithm } from "./store";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import {
  updateBatchSizeAction,
  updateEpochsAction,
  updateLearningRateAction,
  updateLossFunctionAction,
  updateOptimizationAlgorithmAction,
} from "./store/actions";
import { compileOptionsSelector, fitOptionsSelector } from "./store/selectors";

const enumKeys = <O extends object, K extends keyof O = keyof O>(
  obj: O
): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};

type ClassifierSettingsDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const ClassifierSettingsDialog = ({
  onClose,
  open,
}: ClassifierSettingsDialogProps) => {
  const dispatch = useDispatch();

  const compileOptions = useSelector(compileOptionsSelector);

  const fitOptions = useSelector(fitOptionsSelector);

  const classes = useStyles();

  const onBatchSizeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch(
      updateBatchSizeAction({
        batchSize: parseFloat(event.target.value as string),
      })
    );
  };

  const onEpochsChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch(
      updateEpochsAction({
        epochs: parseFloat(event.target.value as string),
      })
    );
  };

  const onLearningRateChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    dispatch(
      updateLearningRateAction({
        learningRate: parseFloat(event.target.value as string),
      })
    );
  };

  const onLossFunctionChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    dispatch(
      updateLossFunctionAction({
        lossFunction: event.target.value as LossFunction,
      })
    );
  };

  const onOptimizationAlgorithmChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    dispatch(
      updateOptimizationAlgorithmAction({
        optimizationAlgorithm: event.target.value as OptimizationAlgorithm,
      })
    );
  };

  return (
    <Dialog fullScreen onClose={onClose} open={open}>
      <AppBar className={classes.settingsDialogAppBar}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <DialogContent className={classes.classifierSettingsDialogContent}>
        <Container className={classes.container} maxWidth="md">
          <Tabs
            centered
            indicatorColor="primary"
            onChange={() => {}}
            textColor="primary"
            value={0}
            variant="fullWidth"
          >
            <Tab label="Preprocessing" />
            <Tab label="Training" />
            <Tab label="Architecture" />
          </Tabs>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <React.Fragment />
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                helperText="&nbsp;"
                id="optimization-algorithm"
                label="Optimization algorithm"
                onChange={onOptimizationAlgorithmChange}
                select
                value={compileOptions.optimizationAlgorithm}
              >
                {enumKeys(OptimizationAlgorithm).map((k) => {
                  return (
                    <MenuItem key={k} value={OptimizationAlgorithm[k]}>
                      {OptimizationAlgorithm[k]}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                helperText="&nbsp;"
                id="learning-rate"
                label="Learning rate"
                onChange={onLearningRateChange}
                type="number"
                value={compileOptions.learningRate}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                helperText="&nbsp;"
                id="loss-function"
                label="Loss function"
                onChange={onLossFunctionChange}
                select
                value={compileOptions.lossFunction}
              >
                {enumKeys(LossFunction).map((k) => {
                  return (
                    <MenuItem key={k} value={LossFunction[k]}>
                      {LossFunction[k]}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={3}>
              <TextField
                fullWidth
                helperText="&nbsp;"
                id="batch-size"
                label="Batch size"
                onChange={onBatchSizeChange}
                type="number"
                value={fitOptions.batchSize}
              />
            </Grid>

            <Grid item xs={3}>
              <TextField
                fullWidth
                helperText="&nbsp;"
                id="epochs"
                label="Epochs"
                onChange={onEpochsChange}
                type="number"
                value={fitOptions.epochs}
              />
            </Grid>
          </Grid>
        </Container>
      </DialogContent>
    </Dialog>
  );
};
