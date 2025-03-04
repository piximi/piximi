import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CollapsibleListItem } from "components/ui/CollapsibleListItem";
import { OptimizerSettingsGrid } from "../training-settings";

import { classifierSlice } from "store/classifier";
import { selectActiveClassifierOptimizerSettings } from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";

import { LossFunction, OptimizationAlgorithm } from "utils/models/enums";

import { FitOptions } from "utils/models/types";

export const ClassifierOptimizerListItem = ({
  fitOptions,
  trainable,
}: {
  fitOptions: FitOptions;
  trainable: boolean;
}) => {
  const compileOptions = useSelector(selectActiveClassifierOptimizerSettings);
  const activeKindId = useSelector(selectActiveKindId);
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
  return (
    <CollapsibleListItem
      primaryText="Optimizer Settings"
      carotPosition="start"
      divider={true}
    >
      <OptimizerSettingsGrid
        compileOptions={compileOptions}
        dispatchLossFunctionCallback={dispatchLossFunctionCallback}
        dispatchOptimizationAlgorithmCallback={
          dispatchOptimizationAlgorithmCallback
        }
        dispatchEpochsCallback={dispatchEpochsCallback}
        fitOptions={fitOptions}
        dispatchBatchSizeCallback={dispatchBatchSizeCallback}
        dispatchLearningRateCallback={dispatchLearningRateCallback}
        isModelTrainable={trainable}
      />
    </CollapsibleListItem>
  );
};
