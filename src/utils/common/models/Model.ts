import { GraphModel, History, LayersModel } from "@tensorflow/tfjs";
import { CallbackList } from "@tensorflow/tfjs-layers";

import { ImageType } from "types";
import { ModelTask } from "types/ModelType";
import { ModelLayerData } from "./utils/getModelSummary";

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

  protected _model?: LayersModel | GraphModel;

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

  abstract loadModel(loadModelArgs?: any): void | Promise<void>;
  abstract loadTraining(images: ImageType[], preprocessingArgs: any): void;
  abstract loadValidation(images: ImageType[], preprocessingArgs: any): void;
  abstract loadInference(images: ImageType[], preprocessingArgs: any): void;

  abstract train(options: any, callbacks: any): Promise<History>;
  abstract predict(options: any, callbacks: any): any;
  abstract evaluate(): any;

  abstract dispose(): void;

  abstract stopTraining(): void;

  async saveModel() {
    if (!this._model) throw Error(`Model ${this.name} not loaded`);
    await this._model.save(`downloads://${this.name}`);
  }

  abstract get modelLoaded(): boolean;
  abstract get trainingLoaded(): boolean;
  abstract get validationLoaded(): boolean;
  abstract get inferenceLoaded(): boolean;

  abstract get defaultInputShape(): number[];
  abstract get defaultOutputShape(): number[];

  abstract get modelSummary(): Array<ModelLayerData>;

  //abstract onEpochEnd: TrainingCallbacks["onEpochEnd"];

  static verifyTFHubUrl(url: string) {
    return url.includes("tfhub.dev");
  }
}
