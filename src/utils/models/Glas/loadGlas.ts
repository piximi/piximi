import { io, loadGraphModel } from "@tensorflow/tfjs";

import GlasModel from "data/model-data/glas/model.json";
//@ts-ignore
import glasWeights1 from "data/model-data/glas/group1-shard1of5.bin";
//@ts-ignore
import glasWeights2 from "data/model-data//glas/group1-shard2of5.bin";
//@ts-ignore
import glasWeights3 from "data/model-data/glas/group1-shard3of5.bin";
//@ts-ignore
import glasWeights4 from "data/model-data//glas/group1-shard4of5.bin";
//@ts-ignore
import glasWeights5 from "data/model-data//glas/group1-shard5of5.bin";

/*
 * model.json contains 'modelTopology' and 'weightsManifest
 *
 * 'modelTopology': A JSON object that can be either of:
 *   1) a model architecture JSON consistent with the format of the return value of keras.Model.to_json()
 *   2) a full model JSON in the format of keras.models.save_model().
 *
 * 'weightsManifest': A TensorFlow.js weights manifest.
 *   See the Python converter function save_model() for more details.
 *   It is also assumed that model weights (.bin files) can be accessed
 *   from relative paths described by the paths fields in weights manifest.
 */

export async function loadGlas() {
  let modelDescription: File;
  let modelWeights1: File;
  let modelWeights2: File;
  let modelWeights3: File;
  let modelWeights4: File;
  let modelWeights5: File;

  try {
    const model_desc_blob = new Blob([JSON.stringify(GlasModel)], {
      type: "application/json",
    });
    modelDescription = new File([model_desc_blob], "model.json", {
      type: "application/json",
    });

    const model_weights_fetch1 = await fetch(glasWeights1);
    const model_weights_blob1 = await model_weights_fetch1.blob();
    modelWeights1 = new File([model_weights_blob1], "group1-shard1of5.bin", {
      type: "application/octet-stream",
    });
    const model_weights_fetch2 = await fetch(glasWeights2);
    const model_weights_blob2 = await model_weights_fetch2.blob();
    modelWeights2 = new File([model_weights_blob2], "group1-shard2of5.bin", {
      type: "application/octet-stream",
    });
    const model_weights_fetch3 = await fetch(glasWeights3);
    const model_weights_blob3 = await model_weights_fetch3.blob();
    modelWeights3 = new File([model_weights_blob3], "group1-shard3of5.bin", {
      type: "application/octet-stream",
    });
    const model_weights_fetch4 = await fetch(glasWeights4);
    const model_weights_blob4 = await model_weights_fetch4.blob();
    modelWeights4 = new File([model_weights_blob4], "group1-shard4of5.bin", {
      type: "application/octet-stream",
    });
    const model_weights_fetch5 = await fetch(glasWeights5);
    const model_weights_blob5 = await model_weights_fetch5.blob();
    modelWeights5 = new File([model_weights_blob5], "group1-shard5of5.bin", {
      type: "application/octet-stream",
    });
  } catch (err) {
    const error: Error = err as Error;
    process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "1" &&
      console.error(`error loading stardist: ${error.message}`);
    throw err;
  }

  try {
    const model = await loadGraphModel(
      io.browserFiles([
        modelDescription,
        modelWeights1,
        modelWeights2,
        modelWeights3,
        modelWeights4,
        modelWeights5,
      ])
    );

    return model;
  } catch (err) {
    const error: Error = err as Error;

    process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "1" &&
      console.error(`error loading stardist: ${error.message}`);

    throw err;
  }
}
