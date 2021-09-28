import * as React from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Grid, MenuItem, TextField } from "@material-ui/core";
import * as _ from "lodash";

const optimizationAlgorithms = {
  adadelta: "Adadelta",
  adam: "Adam",
  adamax: "Adamax",
  rmsprop: "RMSProp",
  sgd: "Stochastic gradient descent (SGD)",
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {
      // width: 200,
    },
    textField: {
      // marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      flexBasis: 300,
      width: "100%",
    },
  })
);

type OptimizationGridProps = {
  optimizationAlgorithm: string;
  onOptimizationAlgorithmChange: (event: React.FormEvent<EventTarget>) => void;
  learningRate: number;
  onLearningRateChange: (event: React.FormEvent<EventTarget>) => void;
};

export const OptimizationGrid = (props: OptimizationGridProps) => {
  const {
    optimizationAlgorithm,
    onOptimizationAlgorithmChange,
    learningRate,
    onLearningRateChange,
  } = props;

  interface State {
    lossFunction: string;
    optimizationAlgorithm: string;
  }

  const [values, setValues] = React.useState<State>({
    lossFunction: "softmaxCrossEntropy",
    optimizationAlgorithm: "adam",
  });

  const classes = useStyles({});

  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <TextField
          id="optimization-algorithm"
          select
          label="Optimization algorithm"
          className={classes.textField}
          value={optimizationAlgorithm}
          onChange={onOptimizationAlgorithmChange}
          SelectProps={{
            MenuProps: {
              className: classes.menu,
            },
          }}
          margin="normal"
        >
          {_.map(optimizationAlgorithms, (v, k) => {
            return (
              <MenuItem dense key={k} value={k}>
                {v}
              </MenuItem>
            );
          })}
        </TextField>
      </Grid>

      <Grid item xs={4}>
        <TextField
          id="learning-rate"
          label="Learning rate"
          className={classes.textField}
          value={learningRate}
          onChange={onLearningRateChange}
          margin="normal"
          type="number"
        />
      </Grid>
    </Grid>
  );
};
