import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";
import { SegmenterModelProps } from "./ModelType";
import { Shape } from "./Shape";

export type ClassifierArchitectureOptions = {
  selectedModel: SequentialClassifier;
  inputShape: Shape;
};

export type SegmenterArchitectureOptions = {
  selectedModel: SegmenterModelProps;
  inputShape: Shape;
};
