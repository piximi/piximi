import { ArchitectureOptions } from "types/ArchitectureOptions";
import { ModelType } from "types/ModelType";
import {
  createFCNSegmenterModel,
  createSimpleFCNSegmenterModel,
} from "../models";

export const createSegmentationModel = async (
  modelOptions: ArchitectureOptions,
  classes: number
) => {
  switch (modelOptions.selectedModel.modelType) {
    case ModelType.FCNSegmenter: {
      return createFCNSegmenterModel(modelOptions.inputShape, classes);
    }
    case ModelType.SimpleFCNSegmenter: {
      return createSimpleFCNSegmenterModel(modelOptions.inputShape, classes);
    }
    default: {
      throw new Error("Invalid model selected");
    }
  }
};
