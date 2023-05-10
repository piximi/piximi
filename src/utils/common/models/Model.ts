import { History } from "@tensorflow/tfjs";
import { CallbackList } from "@tensorflow/tfjs-layers";

import { ImageType } from "types";
import { ModelTask } from "types/ModelType";

type ModelArgs = {
  name: string;
  task: ModelTask;
  graph: boolean;
  src: string;
  pretrained: boolean;
  requiredChannels?: number;
};

export type TrainingCallbacks = {
  onEpochEnd: CallbackList["onEpochEnd"];
};

export abstract class Model<L = never> {
  readonly name: string;
  readonly task: ModelTask;
  readonly graph: boolean;
  readonly src: string;
  readonly pretrained: boolean;
  readonly requiredChannels?: number;

  constructor({
    name,
    task,
    graph,
    src,
    pretrained,
    requiredChannels,
  }: ModelArgs) {
    this.name = name;
    this.task = task;
    this.graph = graph;
    this.src = src;
    this.pretrained = pretrained;
    this.requiredChannels = requiredChannels;
  }

  abstract loadModel(loadModelArgs: L): void;
  abstract loadTraining(images: ImageType[], preprocessingArgs: any): void;
  abstract loadValidation(images: ImageType[], preprocessingArgs: any): void;
  abstract loadInference(images: ImageType[], preprocessingArgs: any): void;

  abstract train(options: any, callbacks: any): Promise<History>;
  abstract predict(options: any, callbacks: any): any;

  abstract dispose(): void;

  abstract get modelLoaded(): boolean;
  abstract get trainingLoaded(): boolean;
  abstract get validationLoaded(): boolean;
  abstract get inferenceLoaded(): boolean;

  //abstract onEpochEnd: TrainingCallbacks["onEpochEnd"];
}
