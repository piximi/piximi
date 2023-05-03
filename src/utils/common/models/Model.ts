<<<<<<< HEAD
import { History } from "@tensorflow/tfjs";
import { CallbackList } from "@tensorflow/tfjs-layers";
||||||| parent of ed10429d ([opt, mod] Create SimpleCNN model abstraction)
import { GraphModel, LayersModel, Tensor } from "@tensorflow/tfjs";
import { ModelArchitecture, ModelTask } from "types/ModelType";
=======
import { History } from "@tensorflow/tfjs";

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
>>>>>>> ed10429d ([opt, mod] Create SimpleCNN model abstraction)

<<<<<<< HEAD
import { ImageType } from "types";
import { ModelTask } from "types/ModelType";

type ModelArgs = {
  name: string;
||||||| parent of ed10429d ([opt, mod] Create SimpleCNN model abstraction)
export abstract class Model {
  modelArch: ModelArchitecture;
  modelName: string;
=======
export abstract class Model {
  name: string;
>>>>>>> ed10429d ([opt, mod] Create SimpleCNN model abstraction)
  task: ModelTask;
  graph: boolean;
  pretrained: boolean;
  trainable: boolean;
  src?: string;
  requiredChannels?: number;
};

<<<<<<< HEAD
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
||||||| parent of ed10429d ([opt, mod] Create SimpleCNN model abstraction)
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
=======
  constructor({
    name,
    task,
    graph,
    src,
    pretrained,
    requiredChannels,
  }: ModelArgs) {
    this.name = name;
>>>>>>> ed10429d ([opt, mod] Create SimpleCNN model abstraction)
    this.task = task;
    this.graph = graph;
    this.pretrained = pretrained;
    this.trainable = trainable;
    this.src = src;
    this.requiredChannels = requiredChannels;
  }

<<<<<<< HEAD
  abstract loadModel(loadModelArgs: any): void;
  abstract loadTraining(images: ImageType[], preprocessingArgs: any): void;
  abstract loadValidation(images: ImageType[], preprocessingArgs: any): void;
  abstract loadInference(images: ImageType[], preprocessingArgs: any): void;

  abstract train(options: any, callbacks: any): Promise<History>;
  abstract predict(options: any, callbacks: any): any;
  abstract evaluate(): any;

||||||| parent of ed10429d ([opt, mod] Create SimpleCNN model abstraction)
  abstract preprocess(data: Tensor): Tensor;
  abstract train(data: Tensor, labels: Tensor): void;
  abstract predict(data: Tensor): Tensor;
  abstract embedding(data: Tensor): Tensor;
  abstract load(): LayersModel | GraphModel;
=======
  abstract loadModel(loadModelArgs: any): void;
  abstract loadTraining(images: ImageType[], preprocessingArgs: any): void;
  abstract loadValidation(images: ImageType[], preprocessingArgs: any): void;
  abstract loadInference(images: ImageType[], preprocessingArgs: any): void;

  abstract train(options: any, callbacks: any): Promise<History>;
  abstract predict(options: any, callbacks: any): any;

>>>>>>> ed10429d ([opt, mod] Create SimpleCNN model abstraction)
  abstract dispose(): void;
<<<<<<< HEAD

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
||||||| parent of ed10429d ([opt, mod] Create SimpleCNN model abstraction)
=======

  abstract modelLoaded(): boolean;
  abstract trainingLoaded(): boolean;
  abstract validationLoaded(): boolean;
  abstract inferenceLoaded(): boolean;
>>>>>>> ed10429d ([opt, mod] Create SimpleCNN model abstraction)
}
