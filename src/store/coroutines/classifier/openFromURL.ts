import * as tensorflow from "@tensorflow/tfjs";

/**
 * Given a model URL (e.g. "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";),
 * Opens the model and adds softmax layer to it
 * **/
export const openFromURL = async (
  modelUrl: string,
  classes: number
): Promise<tensorflow.LayersModel> => {
  const backbone = await tensorflow.loadLayersModel(modelUrl);

  const truncated = tensorflow.model({
    inputs: backbone.inputs,
    outputs: backbone.getLayer("conv_pw_13_relu").output,
  });

  const flattened = tensorflow.layers.flatten({
    inputShape: truncated.outputs[0].shape.slice(1),
  });

  const softmax = tensorflow.layers.dense({
    units: classes,
    kernelInitializer: "varianceScaling",
    useBias: false,
    activation: "softmax",
  });

  const config = {
    layers: [...truncated.layers, flattened, softmax],
  };

  return tensorflow.sequential(config);
};
