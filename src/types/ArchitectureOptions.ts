import { ClassifierModelProps } from "./ClassifierModelType";
import { Shape } from "./Shape";

export type ArchitectureOptions = {
  selectedModel: ClassifierModelProps;
  inputShape: Shape;
};
