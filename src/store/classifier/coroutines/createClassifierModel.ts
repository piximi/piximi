// @ts-nocheck ; TODO - segmenter: this is no longer required
import { ClassifierArchitectureOptions, ModelArchitecture } from "types";
import { createSimpleCNN } from "../../coroutine-models/simpleCNN";
import { createMobileNet } from "../../coroutine-models/mobileNet";

export const createClassifierModel = async (
  modelOptions: ClassifierArchitectureOptions,
  classes: number
) => {
  switch (modelOptions.selectedModel.modelArch) {
    case ModelArchitecture.SimpleCNN: {
      return createSimpleCNN(modelOptions.inputShape, classes);
    }
    case ModelArchitecture.MobileNet: {
      return createMobileNet(modelOptions.inputShape, classes);
    }
    default: {
      throw new Error("Invalid model selected");
    }
  }
};
