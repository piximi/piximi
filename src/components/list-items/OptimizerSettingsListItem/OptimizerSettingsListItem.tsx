import { OptimizerSettingsGrid } from "components/forms";
import { OptimizerSettingsGridProps } from "components/forms/OptimizerSettingsGrid";

import { CollapsibleListItem } from "../CollapsibleListItem";

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
        isModelTrainable={isModelTrainable}
      />
    </CollapsibleListItem>
  );
};
