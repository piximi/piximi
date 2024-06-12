import { Stardist } from "../AbstractStardist";
import { loadStardistFluo } from "./loadStardistFluo";
import { ModelTask } from "../../enums";

/*
 * Stardist (Versatile) Fluorescence Nuclei Segmentation
 * https://zenodo.org/records/6348085
 * https://bioimage.io/#/?tags=stardist&id=10.5281%2Fzenodo.6348084
 * https://github.com/stardist/stardist/blob/master/README.md#pretrained-models-for-2d
 * Stardist: model for object detection / instance segmentation with star-convex shapes
 * This pretrained model: meant to segment individual cell nuclei from single channel fluorescence data (2018 DSB)
 */
export class StardistFluo extends Stardist {
  constructor() {
    super({
      name: "StardistFluo",
      task: ModelTask.Segmentation,
      graph: true,
      pretrained: true,
      trainable: false,
      requiredChannels: 3,
    });
  }

  public async loadModel() {
    if (this._model) return;
    // inputs: [ {name: 'input', shape: [-1,-1,-1,1], dtype: 'float32'} ]
    // outputs: [ {name: 'concatenate_4/concat', shape: [-1, -1, -1, 33], dtype: 'float32'} ]
    // where each -1 matches on input and output of corresponding dim/axis
    // 33 -> 1 probability score, followed by 32 radial equiangular distances of rays
    this._model = await loadStardistFluo();
  }
}
