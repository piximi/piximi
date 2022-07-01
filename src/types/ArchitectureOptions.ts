import { ClassifierModelProps } from "./ModelType";
import { Shape } from "./Shape";

export type ArchitectureOptions = {
  selectedModel: ClassifierModelProps;
  inputShape: Shape;
};
