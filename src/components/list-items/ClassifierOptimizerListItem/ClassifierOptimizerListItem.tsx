import React from "react";
import { CollapsibleListItem } from "../CollapsibleListItem";
import { OptimizerSettingsGrid } from "components/forms";
import { useDispatch, useSelector } from "react-redux";
import {
  classifierSlice,
  selectClassifierCompileOptions,
} from "store/classifier";
import { FitOptions, LossFunction, OptimizationAlgorithm } from "types";

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
