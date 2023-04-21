import { ClassifierArchitectureOptions, TheModel } from "types";
import { createSimpleCNN } from "../../coroutine-models/simpleCNN";
import { createMobileNet } from "../../coroutine-models/mobileNet";

export const createClassifierModel = async (
  modelOptions: ClassifierArchitectureOptions,
  classes: number
) => {
  switch (modelOptions.selectedModel.theModel) {
    case TheModel.SimpleCNN: {
      return createSimpleCNN(modelOptions.inputShape, classes);
    }
    case TheModel.MobileNet: {
      return createMobileNet(modelOptions.inputShape, classes);
    }
    default: {
      throw new Error("Invalid model selected");
    }
  }
};
