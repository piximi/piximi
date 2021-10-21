import { ArchitectureOptions } from "../../../types/ArchitectureOptions";
import { simpleCNN } from "../../../components/FitClassifierDialog/FitClassifierDialog/networks";

export const open = async (
  modelOptions: ArchitectureOptions,
  classes: number
) => {
  if (modelOptions.modelName === "SimpleCNN") {
    return simpleCNN(modelOptions.inputShape, classes);
  } else {
    return simpleCNN(modelOptions.inputShape, classes); //default is simpleCNNs
  }
};
