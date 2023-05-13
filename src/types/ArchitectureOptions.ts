import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";
import { Shape } from "./Shape";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";

export type ClassifierArchitectureOptions = {
  selectedModel: SequentialClassifier;
  inputShape: Shape;
};

export type SegmenterArchitectureOptions = {
  selectedModel: Segmenter;
  inputShape: Shape;
};
