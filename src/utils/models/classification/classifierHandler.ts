import { SequentialClassifier } from "./AbstractClassifier";
import { MobileNet } from "./MobileNet";
import { SimpleCNN } from "./SimpleCNN";

export class ClassifierHandler {
  readonly _availableClassifierArchitectures: [
    typeof SimpleCNN,
    typeof MobileNet,
  ] = [SimpleCNN, MobileNet];
  private _availableClassificationModels: Record<string, SequentialClassifier> =
    {};

  constructor(
    models?: Record<string, SequentialClassifier> | Array<SequentialClassifier>,
  ) {
    if (Array.isArray(models)) {
      this._availableClassificationModels = models.reduce(
        (acc: Record<string, SequentialClassifier>, model) => {
          acc[model.name] = model;
          return acc;
        },
        {},
      );
    } else {
      this._availableClassificationModels = models || {};
    }
  }

  public get availableClassifierArchitectures() {
    return this._availableClassifierArchitectures;
  }

  public get availableClassificationModels() {
    return this._availableClassificationModels;
  }
  public getModel(modelName: string) {
    return this._availableClassificationModels[modelName];
  }

  public getModelArchitecture(modelIndex: number) {
    return this._availableClassifierArchitectures[modelIndex];
  }

  public getModelNames() {
    return Object.keys(this._availableClassificationModels);
  }
  async createNewModel(
    modelName: string,
    architecture: 0 | 1,
  ): Promise<SequentialClassifier> {
    try {
      const model = new this._availableClassifierArchitectures[architecture](
        modelName,
      );
      this._availableClassificationModels[modelName] = model;
      return model;
    } catch (err: any) {
      throw new Error("Failed to create Model.", { cause: err as Error });
    }
  }
  public addModel(model: SequentialClassifier) {
    this._availableClassificationModels[model.name] = model;
  }

  public removeModel(modelName: string) {
    const model = this.availableClassificationModels[modelName];
    model.dispose();
    delete this.availableClassificationModels[modelName];
  }
}

const classifierHandler = new ClassifierHandler();
export default classifierHandler;
