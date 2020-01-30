import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import {updateLossFunctionAction} from "@piximi/store";
import {ClassifierState, Loss} from "@piximi/types";
import * as React from "react";
import {useDispatch, useSelector} from "react-redux";

import {useStyles} from "./LossFunction.css";

const LOSS_FUNCTIONS = new Map<Loss, string>();

LOSS_FUNCTIONS.set(Loss.BinaryCrossentropy, "Binary cross-entropy");

LOSS_FUNCTIONS.set(Loss.CategoricalCrossentropy, "Categorical cross-entropy");

LOSS_FUNCTIONS.set(Loss.CategoricalHinge, "Categorical hinge");

LOSS_FUNCTIONS.set(Loss.CosineProximity, "Cosine proximity");

LOSS_FUNCTIONS.set(Loss.Hinge, "Hinge");

LOSS_FUNCTIONS.set(
  Loss.KullbackLeiblerDivergence,
  "Kullback-Leibler divergence"
);

LOSS_FUNCTIONS.set(Loss.Logcosh, "Logcosh");

LOSS_FUNCTIONS.set(Loss.MeanAbsoluteError, "Mean absolute error (MAE)");

LOSS_FUNCTIONS.set(
  Loss.MeanAbsolutePercentageError,
  "Mean absolute percentage error (MAPE)"
);

LOSS_FUNCTIONS.set(Loss.MeanSquaredError, "Mean squared error (MSE)");

LOSS_FUNCTIONS.set(
  Loss.MeanSquaredLogarithmicError,
  "Mean squared logarithmic error (MSLE)"
);

LOSS_FUNCTIONS.set(Loss.Poisson, "Poisson");

LOSS_FUNCTIONS.set(
  Loss.SparseCategoricalCrossentropy,
  "Sparse categorical cross-entropy"
);

LOSS_FUNCTIONS.set(Loss.SquaredHinge, "Squared hinge");

type LossFunctionProps = {};

export const LossFunction = ({}: LossFunctionProps) => {
  const dispatch = useDispatch();

  const onChange = React.useCallback(
    (event: React.ChangeEvent<{value: Loss}>) => {
      const action = updateLossFunctionAction({
        lossFunction: event.target.value
      });

      dispatch(action);
    },
    [dispatch]
  );

  const lossFunction = useSelector(
    ({classifier}: {classifier: ClassifierState}): Loss => {
      return classifier.lossFunction as Loss;
    }
  );

  const classes = useStyles({});

  return (
    <FormControl className={classes.formControl}>
      <InputLabel id="loss-label">Loss function</InputLabel>

      <Select
        id="loss"
        labelId="loss-label"
        onChange={onChange}
        value={lossFunction}
      >
        {Array.from(LOSS_FUNCTIONS).map(([k, v]: [Loss, string]) => {
          return (
            <MenuItem key={k} value={k}>
              {v}
            </MenuItem>
          );
        })}
      </Select>

      <FormHelperText>&nbsp;</FormHelperText>
    </FormControl>
  );
};
