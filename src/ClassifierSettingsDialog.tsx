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
  updateClassifierLearningRateAction,
} from "./store";

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

  const onLearningRateChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    updateClassifierLearningRateAction({
      learningRate: parseFloat(event.target.value as string),
    });
  };

  const onLossFunctionChange = () => {};

  const onOptimizationAlgorithmChange = () => {};

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

      <DialogContent>
        <Container className={classes.container} maxWidth="md">
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField
                select
                label="Optimization Algorithm"
                id="optimization-algorithm"
                value={classifier.optimizationAlgorithm}
                fullWidth
                helperText="Select an optimization algorithm"
                onChange={onOptimizationAlgorithmChange}
              >
                <MenuItem value={OptimizationAlgorithm.Adadelta}>
                  Adadelta
                </MenuItem>
                <MenuItem value={OptimizationAlgorithm.Adam}>Adam</MenuItem>
                <MenuItem value={OptimizationAlgorithm.Adamax}>Adamax</MenuItem>
                <MenuItem value={OptimizationAlgorithm.RMSProp}>
                  RMSProp
                </MenuItem>
                <MenuItem value={OptimizationAlgorithm.SGD}>
                  Stochastic Gradient Descent (SGD)
                </MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="number"
                label="Learning Rate"
                id="learning-rate"
                value={classifier.learningRate}
                fullWidth
                helperText="Select a learning rate"
                onChange={onLearningRateChange}
              ></TextField>
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField
                select
                label="Loss Function"
                id="loss-function"
                value={classifier.lossFunction}
                fullWidth
                helperText="Select a loss function"
                onChange={onLossFunctionChange}
              >
                <MenuItem value={LossFunction.AD}>Absolute Difference</MenuItem>
                <MenuItem value={LossFunction.MSE}>
                  Mean Squared Error (MSE)
                </MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Container>
      </DialogContent>
    </Dialog>
  );
};
