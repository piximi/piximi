import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CollapsibleListItem } from "components/CollapsibleListItem";
import { OptimizerSettingsGrid } from "sections/model-settings";

import { classifierSlice } from "store/classifier";
import { selectClassifierCompileOptions } from "store/classifier/selectors";

import { LossFunction, OptimizationAlgorithm } from "utils/models/enums";

import { FitOptions } from "utils/models/types";

export const ClassifierOptimizerListItem = ({
  fitOptions,
  trainable,
}: {
  fitOptions: FitOptions;
  trainable: boolean;
}) => {
  const compileOptions = useSelector(selectClassifierCompileOptions);
  const dispatch = useDispatch();

  const dispatchBatchSizeCallback = (batchSize: number) => {
    dispatch(classifierSlice.actions.updateBatchSize({ batchSize: batchSize }));
  };

  const dispatchLearningRateCallback = (learningRate: number) => {
    dispatch(
      classifierSlice.actions.updateLearningRate({
        learningRate: learningRate,
      })
    );
  };

  const dispatchEpochsCallback = (epochs: number) => {
    dispatch(classifierSlice.actions.updateEpochs({ epochs: epochs }));
  };

  const dispatchOptimizationAlgorithmCallback = (
    optimizationAlgorithm: OptimizationAlgorithm
  ) => {
    dispatch(
      classifierSlice.actions.updateOptimizationAlgorithm({
        optimizationAlgorithm: optimizationAlgorithm,
      })
    );
  };

  const dispatchLossFunctionCallback = (lossFunction: LossFunction) => {
    dispatch(
      classifierSlice.actions.updateLossFunction({
        lossFunction: lossFunction,
      })
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
