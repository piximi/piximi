import {
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { StyledFormControl } from "../../../FitClassifierDialog/StyledFormControl";
import { LossFunction } from "types/LossFunction";
import { OptimizationAlgorithm } from "types/OptimizationAlgorithm";
import { CustomNumberTextField } from "../../CustomNumberTextField/CustomNumberTextField";
import { enumKeys } from "utils/enumKeys";
import { FitOptions } from "types/FitOptions";
import { CompileOptions } from "types/CompileOptions";

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
};

export const OptimizerSettingsGrid = ({
  compileOptions,
  dispatchLossFunctionCallback,
  dispatchOptimizationAlgorithmCallback,
  dispatchEpochsCallback,
  fitOptions,
  dispatchBatchSizeCallback,
  dispatchLearningRateCallback,
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
            <Select
              value={compileOptions.optimizationAlgorithm as string}
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
              value={compileOptions.learningRate}
              dispatchCallBack={dispatchLearningRateCallback}
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
              value={compileOptions.lossFunction as string} //TODO #130 fix so that multiple lossFunctions are shown, if we do have multiple loss functions
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
              dispatchCallBack={dispatchBatchSizeCallback}
              min={1}
            />
          </Grid>

          <Grid item xs={2}>
            <CustomNumberTextField
              id="epochs"
              label="Epochs"
              value={fitOptions.epochs}
              dispatchCallBack={dispatchEpochsCallback}
              min={1}
            />
          </Grid>
        </Grid>
      </StyledFormControl>
    </>
  );
};
