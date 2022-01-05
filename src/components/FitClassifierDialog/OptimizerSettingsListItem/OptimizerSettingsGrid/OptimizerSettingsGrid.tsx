import {
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../../../store/slices";
import { LossFunction } from "../../../../types/LossFunction";
import { fitOptionsSelector } from "../../../../store/selectors";
import { learningRateSelector } from "../../../../store/selectors/learningRateSelector";
import { OptimizationAlgorithm } from "../../../../types/OptimizationAlgorithm";
import { useStyles } from "../../FitClassifierDialog/FitClassifierDialog.css";
import { optimizationAlgorithmSelector } from "../../../../store/selectors/optimizationAlgorithmSelector";
import { lossFunctionSelector } from "../../../../store/selectors/lossFunctionSelector";
import { CustomNumberTextField } from "../../../CustomNumberTextField/CustomNumberTextField";

const enumKeys = <O extends object, K extends keyof O = keyof O>(
  obj: O
): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};

export const OptimizerSettingsGrid = () => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const fitOptions = useSelector(fitOptionsSelector);
  const optimizationAlgorithm = useSelector(optimizationAlgorithmSelector);
  const lossFunction = useSelector(lossFunctionSelector);
  const learningRate = useSelector(learningRateSelector);

  const dispatchBatchSize = (batchSize: number) => {
    dispatch(classifierSlice.actions.updateBatchSize({ batchSize: batchSize }));
  };

  const dispatchLearningRate = (learningRate: number) => {
    dispatch(
      classifierSlice.actions.updateLearningRate({ learningRate: learningRate })
    );
  };

  const dispatchEpochs = (arg: number) => {
    dispatch(classifierSlice.actions.updateEpochs({ epochs: arg }));
  };

  const onOptimizationAlgorithmChange = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const optimizationAlgorithm = target.value as OptimizationAlgorithm;

    dispatch(
      classifierSlice.actions.updateOptimizationAlgorithm({
        optimizationAlgorithm: optimizationAlgorithm,
      })
    );
  };

  const onLossFunctionChange = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const lossFunction = target.value as LossFunction;

    dispatch(
      classifierSlice.actions.updateLossFunction({
        lossFunction: lossFunction,
      })
    );
  };

  return (
    <>
      <FormControl className={classes.container} sx={{ m: 1, minWidth: 120 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormHelperText>Optimization Algorithm</FormHelperText>
            <Select
              value={optimizationAlgorithm as string}
              onChange={onOptimizationAlgorithmChange}
              className={classes.select}
              displayEmpty
              inputProps={{ "aria-label": "Without label" }}
            >
              {enumKeys(OptimizationAlgorithm).map((k) => {
                return (
                  <MenuItem key={k} value={OptimizationAlgorithm[k]}>
                    {OptimizationAlgorithm[k]}
                  </MenuItem>
                );
              })}
            </Select>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <CustomNumberTextField
              id="learning-rate"
              label="Learning rate"
              value={learningRate}
              dispatchCallBack={dispatchLearningRate}
              min={0}
              enableFloat={true}
            />
          </Grid>
        </Grid>
      </FormControl>
      <FormControl className={classes.container} sx={{ m: 1, minWidth: 120 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormHelperText>Loss Function</FormHelperText>
            <Select
              value={lossFunction as string} //TODO #130 fix so that multiple lossFunctions are shown, if we do have multiple loss functions
              onChange={onLossFunctionChange}
              className={classes.select}
              displayEmpty
              inputProps={{ "aria-label": "Without label" }}
            >
              {enumKeys(LossFunction).map((k) => {
                return (
                  <MenuItem key={k} value={LossFunction[k]}>
                    {LossFunction[k]}
                  </MenuItem>
                );
              })}
            </Select>
          </Grid>
        </Grid>
        <Grid container direction={"row"} spacing={2}>
          <Grid item xs={2}>
            <CustomNumberTextField
              id="batch-size"
              label="Batch size"
              value={fitOptions.batchSize}
              dispatchCallBack={dispatchBatchSize}
              min={1}
            />
          </Grid>

          <Grid item xs={2}>
            <CustomNumberTextField
              id="epochs"
              label="Epochs"
              value={fitOptions.epochs}
              dispatchCallBack={dispatchEpochs}
              min={1}
            />
          </Grid>
        </Grid>
      </FormControl>
    </>
  );
};
