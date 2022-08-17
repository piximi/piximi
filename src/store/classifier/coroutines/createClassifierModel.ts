import { ArchitectureOptions, ModelType } from "types";
import { createSimpleCNN } from "../../coroutine-models/simpleCNN";
import { createMobileNet } from "../../coroutine-models/mobileNet";

export const createClassifierModel = async (
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
