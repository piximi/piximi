import { GraphModel, History, LayersModel, Tensor } from "@tensorflow/tfjs";

import { ModelArgs, ModelHistory, ModelLayerData } from "../types";
import { ModelTask } from "../enums";
import { NewImageType } from "store/data/types";

export abstract class Model {
  readonly name: string;
  readonly task: ModelTask;
  readonly graph: boolean;
  readonly pretrained: boolean;
  readonly trainable: boolean;
  readonly src?: string;
  readonly requiredChannels?: number;

  protected _model?: LayersModel | GraphModel;
  protected _history: ModelHistory;

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
    // set defaults
    this._model = undefined;
    this._history = { epochs: [], history: [] };
  }

  public dispose() {
    if (this._model) {
      this._model.dispose();
    }
    // set defaults
    this._model = undefined;
    this._history = { epochs: [], history: [] };
  }

  protected appendHistory(history: History) {
    this._history.epochs.push(...history.epoch);

    const numberOnlyHistory: ModelHistory["history"][number] = {};
    for (const key of Object.keys(history.history)) {
      const vals = history.history[key];
      const numberOnlyVals: number[] = [];
      for (const val of vals) {
        if (val instanceof Tensor) {
          const numberVal = val.arraySync() as number;
          val.dispose();
          numberOnlyVals.push(numberVal);
        } else {
          numberOnlyVals.push(val);
        }
      }
      numberOnlyHistory[key] = numberOnlyVals;
    }

    this._history.history.push(numberOnlyHistory);
  }

  public get numEpochs() {
    return this._history.epochs.length;
  }

  public get numTrainingCylces() {
    return this._history.history.length;
  }

  public get history() {
    return this._history;
  }

  public abstract loadModel(loadModelArgs?: any): void | Promise<void>;
  public abstract loadTraining(
    images: NewImageType[],
    preprocessingArgs: any
  ): void;
  public abstract loadValidation(
    images: NewImageType[],
    preprocessingArgs: any
  ): void;
  public abstract loadInference(
    images: NewImageType[],
    preprocessingArgs: any
  ): void;

  public abstract train(options: any, callbacks: any): Promise<History>;
  public abstract predict(options: any, callbacks: any): any;
  public abstract evaluate(): any;

  public abstract stopTraining(): void;

  public async saveModel() {
    if (!this._model) throw Error(`Model ${this.name} not loaded`);
    await this._model.save(`downloads://${this.name}`);
  }

  public abstract get modelLoaded(): boolean;
  public abstract get trainingLoaded(): boolean;
  public abstract get validationLoaded(): boolean;
  public abstract get inferenceLoaded(): boolean;

  public abstract get defaultInputShape(): number[];
  public abstract get defaultOutputShape(): number[] | undefined;

  public abstract get modelSummary(): Array<ModelLayerData>;

  //abstract onEpochEnd: TrainingCallbacks["onEpochEnd"];

  public static verifyTFHubUrl(url: string) {
    return url.includes("tfhub.dev");
  }
}
