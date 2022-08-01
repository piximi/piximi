import * as React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

import { StyledFormControl } from "../../StyledFormControl";

import { CustomNumberTextField } from "components/common/CustomNumberTextField/CustomNumberTextField";

import { fitOptionsSelector } from "store/selectors";
import { learningRateSelector } from "store/selectors/learningRateSelector";
import { optimizationAlgorithmSelector } from "store/selectors/optimizationAlgorithmSelector";
import { lossFunctionSelector } from "store/selectors/lossFunctionSelector";

import { classifierSlice } from "store/slices";

import { LossFunction } from "types/LossFunction";
import { OptimizationAlgorithm } from "types/OptimizationAlgorithm";

import { enumKeys } from "utils/enumKeys";

export const OptimizerSettingsGrid = () => {
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
      <StyledFormControl>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormHelperText>Optimization Algorithm</FormHelperText>
            <Select
              value={optimizationAlgorithm as string}
              onChange={onOptimizationAlgorithmChange}
              displayEmpty
              inputProps={{ "aria-label": "Without label" }}
              sx={(theme) => ({
                flexBasis: 300,
                width: "100%",
                marginRight: theme.spacing(1),
                marginTop: theme.spacing(0),
              })}
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
      </StyledFormControl>
      <StyledFormControl>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormHelperText>Loss Function</FormHelperText>
            <Select
              value={lossFunction as string} //TODO #130 fix so that multiple lossFunctions are shown, if we do have multiple loss functions
              onChange={onLossFunctionChange}
              displayEmpty
              inputProps={{ "aria-label": "Without label" }}
              sx={(theme) => ({
                flexBasis: 300,
                width: "100%",
                marginRight: theme.spacing(1),
                marginTop: theme.spacing(0),
              })}
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
      </StyledFormControl>
    </>
  );
};
