import React from "react";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import { TransitionProps } from "@material-ui/core/transitions";
import Slide from "@material-ui/core/Slide";
import { useStyles } from "./index.css";
import Container from "@material-ui/core/Container";
import DialogContent from "@material-ui/core/DialogContent";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import { useDispatch, useSelector } from "react-redux";
import {
  LossFunction,
  OptimizationAlgorithm,
  State,
  updateClassifierBatchSizeAction,
  updateClassifierEpochsAction,
  updateClassifierLearningRateAction,
  updateClassifierLossFunctionAction,
  updateClassifierOptimizationAlgorithmAction,
} from "./store";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

const enumKeys = <O extends object, K extends keyof O = keyof O>(
  obj: O
): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};

type ClassifierSettingsDialogProps = {
  onClose: () => void;
  open: boolean;
};

const DialogTransition = React.forwardRef(
  (
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>
  ) => {
    return <Slide direction="right" ref={ref} {...props} />;
  }
);

export const ClassifierSettingsDialog = ({
  onClose,
  open,
}: ClassifierSettingsDialogProps) => {
  const dispatch = useDispatch();

  const classifier = useSelector((state: State) => {
    return state.project.classifier;
  });

  const classes = useStyles();

  const onBatchSizeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch(
      updateClassifierBatchSizeAction({
        batchSize: parseFloat(event.target.value as string),
      })
    );
  };

  const onEpochsChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    dispatch(
      updateClassifierEpochsAction({
        epochs: parseFloat(event.target.value as string),
      })
    );
  };

  const onLearningRateChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    dispatch(
      updateClassifierLearningRateAction({
        learningRate: parseFloat(event.target.value as string),
      })
    );
  };

  const onLossFunctionChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    dispatch(
      updateClassifierLossFunctionAction({
        lossFunction: event.target.value as LossFunction,
      })
    );
  };

  const onOptimizationAlgorithmChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    dispatch(
      updateClassifierOptimizationAlgorithmAction({
        optimizationAlgorithm: event.target.value as OptimizationAlgorithm,
      })
    );
  };

  return (
    <Dialog
      fullScreen
      onClose={onClose}
      open={open}
      TransitionComponent={DialogTransition}
    >
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
            <Grid item xs={12}></Grid>
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
                value={classifier.optimizationAlgorithm}
              >
                {enumKeys(OptimizationAlgorithm).map((k) => {
                  return (
                    <MenuItem value={OptimizationAlgorithm[k]}>
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
                value={classifier.learningRate}
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
                value={classifier.lossFunction}
              >
                {enumKeys(LossFunction).map((k) => {
                  return (
                    <MenuItem value={LossFunction[k]}>
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
                value={classifier.batchSize}
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
                value={classifier.epochs}
              />
            </Grid>
          </Grid>
        </Container>
      </DialogContent>
    </Dialog>
  );
};
