import { ArchitectureOptions } from "../../../types/ArchitectureOptions";
import { ModelType } from "../../../types/ModelType";
import { createSimpleCNN } from "../models/simpleCNN";
import { createMobileNet } from "../models/mobileNet";

export const open = async (
  modelOptions: ArchitectureOptions,
  classes: number
) => {
  switch (modelOptions.selectedModel.modelType) {
    case ModelType.SimpleCNN: {
      return createSimpleCNN(modelOptions.inputShape, classes);
    }
    case ModelType.MobileNet: {
      return createMobileNet(modelOptions.inputShape, classes);
    }
    default: {
      throw new Error("Invalid model selected");
    }
  }
};
