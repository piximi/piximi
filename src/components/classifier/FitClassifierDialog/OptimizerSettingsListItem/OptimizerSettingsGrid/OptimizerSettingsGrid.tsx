import * as React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Grid } from "@mui/material";

import { StyledFormControl } from "../../StyledFormControl";

import { OptimizationAlgorithmFormSelect } from "components/classifier/OptimizationAlgorithmFormSelect";
import { LossFunctionFormSelect } from "components/classifier/LossFunctionFormSelect";

import { CustomNumberTextField } from "components/common/CustomNumberTextField/CustomNumberTextField";

import { fitOptionsSelector, learningRateSelector } from "store/selectors";

import { classifierSlice } from "store/slices";

export const OptimizerSettingsGrid = () => {
  const dispatch = useDispatch();

  const fitOptions = useSelector(fitOptionsSelector);
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

  return (
    <>
      <StyledFormControl>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <OptimizationAlgorithmFormSelect />
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
            <LossFunctionFormSelect />
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
