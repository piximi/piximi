import { ArchitectureOptions } from "../../../types/ArchitectureOptions";
import { ModelType } from "../../../types/ClassifierModelType";
import { simpleCNN } from "../models/simpleCNN";

export const open = async (
  modelOptions: ArchitectureOptions,
  classes: number
) => {
  if (modelOptions.selectedModel.modelType === ModelType.SimpleCNN) {
    return simpleCNN(modelOptions.inputShape, classes);
  } else {
    alert("Invalid model selected!");
  }
};
