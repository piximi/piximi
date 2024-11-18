import { Grid, SelectChangeEvent } from "@mui/material";
import { CustomFormSelectField } from "components/CustomFormSelectField";
import { CustomNumberTextField } from "components/CustomNumberTextField";

import { LossFunction, OptimizationAlgorithm } from "utils/models/enums";
import { CompileOptions, FitOptions } from "utils/models/types";

type OptimizerSettingsGridProps = {
  compileOptions: CompileOptions;
  dispatchLossFunctionCallback: (lossFunction: LossFunction) => void;
  dispatchOptimizationAlgorithmCallback: (
    optimizationAlgorithm: OptimizationAlgorithm
  ) => void;
  dispatchLearningRateCallback: (learningRate: number) => void;
  fitOptions: FitOptions;
  dispatchBatchSizeCallback: (batchSize: number) => void;
  dispatchEpochsCallback: (epochs: number) => void;
  isModelTrainable: boolean;
};

export const OptimizerSettingsGrid = ({
  compileOptions,
  dispatchLossFunctionCallback,
  dispatchOptimizationAlgorithmCallback,
  dispatchEpochsCallback,
  fitOptions,
  dispatchBatchSizeCallback,
  dispatchLearningRateCallback,
  isModelTrainable,
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
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <CustomFormSelectField
            keySource={OptimizationAlgorithm}
            value={compileOptions.optimizationAlgorithm as string}
            onChange={onOptimizationAlgorithmChange}
            disabled={!isModelTrainable}
            helperText="OptimizationAlgorithm"
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
            disabled={!isModelTrainable}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <CustomFormSelectField
            keySource={LossFunction}
            value={compileOptions.lossFunction as string}
            onChange={onLossFunctionChange}
            disabled={!isModelTrainable}
            helperText="Loss Function"
          />
        </Grid>
      </Grid>
      <Grid container direction={"row"} spacing={2}>
        <Grid item xs={12} md={4} lg={4}>
          <CustomNumberTextField
            id="batch-size"
            label="Batch size"
            value={fitOptions.batchSize}
            dispatchCallBack={dispatchBatchSizeCallback}
            min={1}
            disabled={!isModelTrainable}
          />
        </Grid>

        <Grid item xs={12} md={4} lg={4}>
          <CustomNumberTextField
            id="epochs"
            label="Epochs"
            value={fitOptions.epochs}
            dispatchCallBack={dispatchEpochsCallback}
            min={1}
            disabled={!isModelTrainable}
          />
        </Grid>
      </Grid>
    </>
  );
};
