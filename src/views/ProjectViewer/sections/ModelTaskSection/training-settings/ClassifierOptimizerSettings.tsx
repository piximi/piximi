import { Grid, SelectChangeEvent } from "@mui/material";

import {
  CustomNumberTextField,
  CustomFormSelectField,
} from "components/inputs";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "store/classifier";
import {
  selectActiveClassifierFitOptions,
  selectActiveClassifierOptimizerSettings,
  selectActiveClassifierTrainingPercentage,
} from "store/classifier/reselectors";
import { selectActiveLabeledThingsCount } from "store/project/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { logger } from "utils/common/helpers";

import { LossFunction, OptimizationAlgorithm } from "utils/models/enums";

type OptimizerSettingsProps = {
  trainable: boolean;
};

export const ClassifierOptimizerSettings = ({
  trainable,
}: OptimizerSettingsProps) => {
  const compileOptions = useSelector(selectActiveClassifierOptimizerSettings);
  const activeKindId = useSelector(selectActiveKindId);
  const trainingPercentage = useSelector(
    selectActiveClassifierTrainingPercentage,
  );
  const labeledThingsCount = useSelector(selectActiveLabeledThingsCount);
  const fitOptions = useSelector(selectActiveClassifierFitOptions);
  const dispatch = useDispatch();

  const dispatchBatchSizeCallback = (batchSize: number) => {
    dispatch(
      classifierSlice.actions.updateModelOptimizerSettings({
        settings: { batchSize },
        kindId: activeKindId,
      }),
    );
  };

  const dispatchLearningRateCallback = (learningRate: number) => {
    dispatch(
      classifierSlice.actions.updateModelOptimizerSettings({
        settings: { learningRate },
        kindId: activeKindId,
      }),
    );
  };

  const dispatchEpochsCallback = (epochs: number) => {
    dispatch(
      classifierSlice.actions.updateModelOptimizerSettings({
        settings: { epochs },
        kindId: activeKindId,
      }),
    );
  };

  const dispatchOptimizationAlgorithmCallback = (
    optimizationAlgorithm: OptimizationAlgorithm,
  ) => {
    dispatch(
      classifierSlice.actions.updateModelOptimizerSettings({
        settings: { optimizationAlgorithm },
        kindId: activeKindId,
      }),
    );
  };

  const dispatchLossFunctionCallback = (lossFunction: LossFunction) => {
    dispatch(
      classifierSlice.actions.updateModelOptimizerSettings({
        settings: { lossFunction },
        kindId: activeKindId,
      }),
    );
  };
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
  useEffect(() => {
    if (
      import.meta.env.NODE_ENV !== "production" &&
      import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
      labeledThingsCount > 0
    ) {
      const trainingSize = Math.round(labeledThingsCount * trainingPercentage);
      const validationSize = labeledThingsCount - trainingSize;

      logger(
        `Set training size to Round[${labeledThingsCount} * ${trainingPercentage}] = ${trainingSize}
        ; val size to ${labeledThingsCount} - ${trainingSize} = ${validationSize}`,
      );

      logger(
        `Set training batches per epoch to RoundUp[${trainingSize} / ${
          fitOptions.batchSize
        }] = ${Math.ceil(trainingSize / fitOptions.batchSize)}`,
      );

      logger(
        `Set validation batches per epoch to RoundUp[${validationSize} / ${
          fitOptions.batchSize
        }] = ${Math.ceil(validationSize / fitOptions.batchSize)}`,
      );

      logger(
        `Training last batch size is ${trainingSize % fitOptions.batchSize}
        ; validation is ${validationSize % fitOptions.batchSize}`,
      );
    }
  }, [fitOptions.batchSize, trainingPercentage, labeledThingsCount]);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <CustomFormSelectField
            keySource={OptimizationAlgorithm}
            value={compileOptions.optimizationAlgorithm as string}
            onChange={onOptimizationAlgorithmChange}
            disabled={!trainable}
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
            disabled={!trainable}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <CustomFormSelectField
            keySource={LossFunction}
            value={compileOptions.lossFunction as string}
            onChange={onLossFunctionChange}
            disabled={!trainable}
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
            disabled={!trainable}
          />
        </Grid>

        <Grid item xs={12} md={4} lg={4}>
          <CustomNumberTextField
            id="epochs"
            label="Epochs"
            value={fitOptions.epochs}
            dispatchCallBack={dispatchEpochsCallback}
            min={1}
            disabled={!trainable}
          />
        </Grid>
      </Grid>
    </>
  );
};
