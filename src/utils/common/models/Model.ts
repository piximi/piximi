import { GraphModel, LayersModel, Tensor } from "@tensorflow/tfjs";
import { ModelArchitecture, ModelTask } from "types/ModelType";

export abstract class Model {
  modelArch: ModelArchitecture;
  modelName: string;
  task: ModelTask;
  graph: boolean;
  src: string;
  pretrained: boolean;
  requiredChannels?: number;

  constructor(
    modelArch: ModelArchitecture,
    modelName: string,
    task: ModelTask,
    graph: boolean,
    src: string,
    pretrained: boolean,
    requiredChannels?: number
  ) {
    this.modelArch = modelArch;
    this.modelName = modelName;
    this.task = task;
    this.graph = graph;
    this.src = src;
    this.pretrained = pretrained;
    this.requiredChannels = requiredChannels;
  }

  abstract preprocess(data: Tensor): Tensor;
  abstract train(data: Tensor, labels: Tensor): void;
  abstract predict(data: Tensor): Tensor;
  abstract embedding(data: Tensor): Tensor;
  abstract load(): LayersModel | GraphModel;
  abstract dispose(): void;
}
