import { FormHelperText, Grid, SelectChangeEvent } from "@mui/material";

import {
  CustomNumberTextField,
  CustomFormSelectField,
  StyledFormControl,
} from "../../../styled-components";

import {
  CompileOptions,
  FitOptions,
  LossFunction,
  OptimizationAlgorithm,
} from "types";

export type OptimizerSettingsGridProps = {
  compileOptions: CompileOptions;
  dispatchLossFunctionCallback: (lossFunction: LossFunction) => void;
  dispatchOptimizationAlgorithmCallback: (
    optimizationAlgorithm: OptimizationAlgorithm
  ) => void;
  dispatchLearningRateCallback: (learningRate: number) => void;
  fitOptions: FitOptions;
  dispatchBatchSizeCallback: (batchSize: number) => void;
  dispatchEpochsCallback: (epochs: number) => void;
  isModelPretrained?: boolean;
};

export const OptimizerSettingsGrid = ({
  compileOptions,
  dispatchLossFunctionCallback,
  dispatchOptimizationAlgorithmCallback,
  dispatchEpochsCallback,
  fitOptions,
  dispatchBatchSizeCallback,
  dispatchLearningRateCallback,
  isModelPretrained,
}: OptimizerSettingsGridProps) => {
  const onOptimizationAlgorithmChange = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const optimizationAlgorithm = target.value as OptimizationAlgorithm;

    dispatchOptimizationAlgorithmCallback(optimizationAlgorithm);
  };

  const onLossFunctionChange = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement; //target.value is string
    const lossFunction = target.value as LossFunction;

    dispatchLossFunctionCallback(lossFunction);
  };

  return (
    <>
      <StyledFormControl>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormHelperText>Optimization Algorithm</FormHelperText>
            <CustomFormSelectField
              keySource={OptimizationAlgorithm}
              value={compileOptions.optimizationAlgorithm as string}
              onChange={onOptimizationAlgorithmChange}
              disabled={isModelPretrained}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <CustomNumberTextField
              id="learning-rate"
              label="Learning rate"
              value={compileOptions.learningRate}
              dispatchCallBack={dispatchLearningRateCallback}
              min={0}
              enableFloat={true}
              disabled={isModelPretrained}
            />
          </Grid>
        </Grid>
      </StyledFormControl>
      <StyledFormControl>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormHelperText>Loss Function</FormHelperText>
            <CustomFormSelectField
              keySource={LossFunction}
              value={compileOptions.lossFunction as string}
              onChange={onLossFunctionChange}
              disabled={isModelPretrained}
            />
          </Grid>
        </Grid>
        <Grid container direction={"row"} spacing={2}>
          <Grid item xs={2}>
            <CustomNumberTextField
              id="batch-size"
              label="Batch size"
              value={fitOptions.batchSize}
              dispatchCallBack={dispatchBatchSizeCallback}
              min={1}
              disabled={isModelPretrained}
            />
          </Grid>

          <Grid item xs={2}>
            <CustomNumberTextField
              id="epochs"
              label="Epochs"
              value={fitOptions.epochs}
              dispatchCallBack={dispatchEpochsCallback}
              min={1}
              disabled={isModelPretrained}
            />
          </Grid>
        </Grid>
      </StyledFormControl>
    </>
  );
};
