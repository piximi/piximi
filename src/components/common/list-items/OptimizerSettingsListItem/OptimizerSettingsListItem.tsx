import {
  OptimizerSettingsGrid,
  OptimizerSettingsGridProps,
} from "./OptimizerSettingsGrid/OptimizerSettingsGrid";
import { CollapsibleList } from "../../styled-components/CollapsibleList";

export const OptimizerSettingsListItem = ({
  compileOptions,
  dispatchLossFunctionCallback,
  dispatchOptimizationAlgorithmCallback,
  dispatchEpochsCallback,
  fitOptions,
  dispatchBatchSizeCallback,
  dispatchLearningRateCallback,
  isModelPretrained,
}: OptimizerSettingsGridProps) => {
  return (
    <CollapsibleList
      dense={false}
      primary="Optimizer Settings"
      disablePadding={false}
      paddingLeft={true}
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
        isModelPretrained={isModelPretrained}
      />
    </CollapsibleList>
  );
};