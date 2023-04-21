import { TheModel, SegmenterArchitectureOptions } from "types";
import {
  createFCNSegmenterModel,
  createSimpleFCNSegmenterModel,
} from "../../coroutine-models";

export const createSegmentationModel = async (
  architectureOptions: SegmenterArchitectureOptions,
  numClasses: number
) => {
  switch (architectureOptions.selectedModel.theModel) {
    case TheModel.FCNSegmenter: {
      return createFCNSegmenterModel(
        architectureOptions.inputShape,
        numClasses
      );
    }
    case TheModel.SimpleFCNSegmenter: {
      return createSimpleFCNSegmenterModel(
        architectureOptions.inputShape,
        numClasses
      );
    }
    default: {
      throw new Error("Invalid model selected");
    }
  }
};
