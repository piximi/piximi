import * as tensorflow from "@tensorflow/tfjs";

export const open = async (
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
