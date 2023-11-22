import { useDispatch, useSelector } from "react-redux";
import { OptimizerSettingsGrid } from "components/forms";

import { CollapsibleListItem } from "../CollapsibleListItem";
import {
  segmenterSlice,
  selectSegmenterCompileOptions,
} from "store/slices/segmenter";
import { FitOptions, LossFunction, OptimizationAlgorithm } from "types";

export const SegmenterOptimizerListItem = ({
  fitOptions,
  trainable,
}: {
  fitOptions: FitOptions;
  trainable: boolean;
}) => {
  const dispatch = useDispatch();
  const compileOptions = useSelector(selectSegmenterCompileOptions);

  const dispatchBatchSizeCallback = (batchSize: number) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationBatchSize({
        batchSize: batchSize,
      })
    );
  };

  const dispatchLearningRateCallback = (learningRate: number) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationLearningRate({
        learningRate: learningRate,
      })
    );
  };

  const dispatchEpochsCallback = (epochs: number) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationEpochs({ epochs: epochs })
    );
  };

  const dispatchOptimizationAlgorithmCallback = (
    optimizationAlgorithm: OptimizationAlgorithm
  ) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationOptimizationAlgorithm({
        optimizationAlgorithm: optimizationAlgorithm,
      })
    );
  };

  const dispatchLossFunctionCallback = (lossFunction: LossFunction) => {
    dispatch(
      segmenterSlice.actions.updateSegmentationLossFunction({
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
