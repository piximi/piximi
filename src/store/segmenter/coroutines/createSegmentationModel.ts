import { ModelArchitecture, SegmenterArchitectureOptions } from "types";
import {
  createFCNSegmenterModel,
  createSimpleFCNSegmenterModel,
} from "../../coroutine-models";

export const createSegmentationModel = async (
  architectureOptions: SegmenterArchitectureOptions,
  numClasses: number
) => {
  switch (architectureOptions.selectedModel.architecture) {
    case ModelArchitecture.FCNSegmenter: {
      return createFCNSegmenterModel(
        architectureOptions.inputShape,
        numClasses
      );
    }
    case ModelArchitecture.SimpleFCNSegmenter: {
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
