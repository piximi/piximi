import { SegmentationArchitectureOptions } from "types/ArchitectureOptions";
import { ModelType } from "types/ModelType";
import {
  createFCNSegmenterModel,
  createSimpleFCNSegmenterModel,
} from "../models";

export const createSegmentationModel = async (
  architectureOptions: SegmentationArchitectureOptions,
  numClasses: number
) => {
  switch (architectureOptions.selectedModel.modelType) {
    case ModelType.FCNSegmenter: {
      return createFCNSegmenterModel(
        architectureOptions.inputShape,
        numClasses
      );
    }
    case ModelType.SimpleFCNSegmenter: {
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
