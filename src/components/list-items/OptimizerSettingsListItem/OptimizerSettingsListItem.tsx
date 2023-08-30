import {
  OptimizerSettingsGrid,
  OptimizerSettingsGridProps,
} from "./OptimizerSettingsGrid/OptimizerSettingsGrid";
import { CollapsibleList } from "components/lists";

export const OptimizerSettingsListItem = ({
  compileOptions,
  dispatchLossFunctionCallback,
  dispatchOptimizationAlgorithmCallback,
  dispatchEpochsCallback,
  fitOptions,
  dispatchBatchSizeCallback,
  dispatchLearningRateCallback,
  isModelTrainable,
}: OptimizerSettingsGridProps) => {
  return (
    <CollapsibleList
      dense={false}
      primary="Optimizer Settings"
      disablePadding={false}
      paddingLeft={true}
      closed={true}
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
        isModelTrainable={isModelTrainable}
      />
    </CollapsibleList>
  );
};
