import { io, loadGraphModel } from "@tensorflow/tfjs";

import Stardist2DBrightfieldModel from "data/model-data/stardist/model.json";
//@ts-ignore
import Stardist2DBrightfieldWeights1 from "data/model-data/stardist/group1-shard1of2.bin";
//@ts-ignore
import Stardist2DBrightfieldWeights2 from "data/model-data//stardist/group1-shard2of2.bin";

export async function loadStardist() {
  let modelTopology: File;
  let modelWeights1: File;
  let modelWeights2: File;

  try {
    const model_topology_blob = new Blob(
      [JSON.stringify(Stardist2DBrightfieldModel)],
      {
        type: "application/json",
      }
    );
    modelTopology = new File([model_topology_blob], "model.json", {
      type: "application/json",
    });

    const model_weights_fetch1 = await fetch(Stardist2DBrightfieldWeights1);
    const model_weights_blob1 = await model_weights_fetch1.blob();
    modelWeights1 = new File([model_weights_blob1], "group1-shard1of2.bin", {
      type: "application/octet-stream",
    });

    const model_weights_fetch2 = await fetch(Stardist2DBrightfieldWeights2);
    const model_weights_blob2 = await model_weights_fetch2.blob();
    modelWeights2 = new File([model_weights_blob2], "group1-shard2of2.bin", {
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
      io.browserFiles([modelTopology, modelWeights1, modelWeights2])
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
