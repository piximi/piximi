import { History } from "@tensorflow/tfjs";
import { CallbackList } from "@tensorflow/tfjs-layers";

import { ImageType } from "types";
import { ModelTask } from "types/ModelType";

type ModelArgs = {
  name: string;
  task: ModelTask;
  graph: boolean;
  pretrained: boolean;
  trainable: boolean;
  src?: string;
  requiredChannels?: number;
};

export type TrainingCallbacks = {
  onEpochEnd: CallbackList["onEpochEnd"];
};

export abstract class Model {
  readonly name: string;
  readonly task: ModelTask;
  readonly graph: boolean;
  readonly pretrained: boolean;
  readonly trainable: boolean;
  readonly src?: string;
  readonly requiredChannels?: number;

  constructor({
    name,
    task,
    graph,
    pretrained,
    trainable,
    src,
    requiredChannels,
  }: ModelArgs) {
    this.name = name;
    this.task = task;
    this.graph = graph;
    this.pretrained = pretrained;
    this.trainable = trainable;
    this.src = src;
    this.requiredChannels = requiredChannels;
  }

  abstract loadModel(loadModelArgs: any): void;
  abstract loadTraining(images: ImageType[], preprocessingArgs: any): void;
  abstract loadValidation(images: ImageType[], preprocessingArgs: any): void;
  abstract loadInference(images: ImageType[], preprocessingArgs: any): void;

  abstract train(options: any, callbacks: any): Promise<History>;
  abstract predict(options: any, callbacks: any): any;
  abstract evaluate(): any;

  abstract dispose(): void;

  abstract get modelLoaded(): boolean;
  abstract get trainingLoaded(): boolean;
  abstract get validationLoaded(): boolean;
  abstract get inferenceLoaded(): boolean;

  abstract get defaultInputShape(): number[];
  abstract get defaultOutputShape(): number[];

  //abstract onEpochEnd: TrainingCallbacks["onEpochEnd"];

  static verifyTFHubUrl(url: string) {
    return url.includes("tfhub.dev");
  }
}
