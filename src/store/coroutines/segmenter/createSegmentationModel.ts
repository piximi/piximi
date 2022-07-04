import { SegmentationArchitectureOptions } from "types/ArchitectureOptions";
import { ModelType } from "types/ModelType";
import {
  createFCNSegmenterModel,
  createSimpleFCNSegmenterModel,
} from "../models";

export const createSegmentationModel = async (
  architectureOptions: SegmentationArchitectureOptions,
  classes: number
) => {
  switch (architectureOptions.selectedModel.modelType) {
    case ModelType.FCNSegmenter: {
      return createFCNSegmenterModel(architectureOptions.inputShape, classes);
    }
    case ModelType.SimpleFCNSegmenter: {
      return createSimpleFCNSegmenterModel(
        architectureOptions.inputShape,
        classes
      );
    }
    default: {
      throw new Error("Invalid model selected");
    }
  }
};
