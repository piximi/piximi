import { TheModel, ModelArchitecture } from "types/ModelType";

export abstract class Model {
  theModel: TheModel;

  constructor(
    modelArchitecure: ModelArchitecture,
    theModel: TheModel,
    modelName: string
  ) {
    this.theModel = theModel;
  }
}
