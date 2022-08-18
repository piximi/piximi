import * as tensorflow from "@tensorflow/tfjs";
import { Shape } from "types/Shape";

/**
 * Creates simple Fully Convolutional Network for semantic segmentation
 * from: https://stackoverflow.com/questions/54600956/fully-convolutional-network
 *
 * @param inputShape Shape of the input images [width, channels, frames, height, planes]
 * @param numClasses Number of segmentation classes to predict
 * @returns tensorflow.layer model
 */
export const createFCNSegmenterModel = (
  inputShape: Shape,
  numClasses: number
) => {
  const imageWidth = inputShape.width;
  const imageHeight = inputShape.height;
  const imageChannels = inputShape.channels;

  const input = tensorflow.input({
    shape: [imageWidth, imageHeight, imageChannels],
    name: "Input",
  });

  const fcn_1_0 = tensorflow.layers
    .conv2d({
      name: "",
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(input);
  const fcn_1_1 = tensorflow.layers
    .conv2d({
      name: "",
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_1_0);
  const fcn_1_2 = tensorflow.layers
    .conv2d({
      name: "",
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_1_1);
  const fcn_2 = tensorflow.layers
    .maxPool2d({ poolSize: [2, 2], strides: [2, 2] })
    .apply(fcn_1_2);

  const fcn_3_0 = tensorflow.layers
    .conv2d({
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_2);
  const fcn_3_1 = tensorflow.layers
    .conv2d({
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_3_0);
  const fcn_3_2 = tensorflow.layers
    .conv2d({
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_3_1);
  const fcn_4 = tensorflow.layers
    .maxPool2d({ poolSize: [2, 2], strides: [2, 2] })
    .apply(fcn_3_2);

  const fcn_5_0 = tensorflow.layers
    .conv2d({
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_4);
  const fcn_5_1 = tensorflow.layers
    .conv2d({
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_5_0);
  const fcn_5_2 = tensorflow.layers
    .conv2d({
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_5_1);
  const fcn_6 = tensorflow.layers
    .maxPool2d({ poolSize: [2, 2], strides: [2, 2] })
    .apply(fcn_5_2);

  const fcn_7_0 = tensorflow.layers
    .conv2d({
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_6);
  const fcn_7_1 = tensorflow.layers
    .conv2d({
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_7_0);
  const fcn_7_2 = tensorflow.layers
    .conv2d({
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_7_1);
  const fcn_8 = tensorflow.layers
    .maxPool2d({ poolSize: [2, 2], strides: [2, 2] })
    .apply(fcn_7_2);

  const fcn_9_0 = tensorflow.layers
    .conv2d({
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_8);
  const fcn_9_1 = tensorflow.layers
    .conv2d({
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_9_0);
  const fcn_9_2 = tensorflow.layers
    .conv2d({
      kernelSize: [3, 3],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(fcn_9_1);
  const fcn_10 = tensorflow.layers
    .maxPool2d({ poolSize: [2, 2], strides: [2, 2] })
    .apply(fcn_9_2);

  const fcn_13_0 = tensorflow.layers
    .conv2d({
      kernelSize: [1, 1],
      strides: [1, 1],
      activation: "relu",
      padding: "same",
      filters: 4096,
    })
    .apply(fcn_10);

  const upsample_1 = tensorflow.layers
    .upSampling2d({ size: [2, 2] })
    .apply(fcn_13_0);
  const conv_upsample1 = tensorflow.layers
    .conv2d({
      kernelSize: 3,
      strides: 1,
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(upsample_1);

  const upsample_2 = tensorflow.layers
    .upSampling2d({ size: [2, 2] })
    .apply(conv_upsample1);
  const conv_upsample2 = tensorflow.layers
    .conv2d({
      kernelSize: 3,
      strides: 1,
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(upsample_2);

  const upsample_3 = tensorflow.layers
    .upSampling2d({ size: [2, 2] })
    .apply(conv_upsample2);
  const conv_upsample3 = tensorflow.layers
    .conv2d({
      kernelSize: 3,
      strides: 1,
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(upsample_3);

  const upsample_4 = tensorflow.layers
    .upSampling2d({ size: [2, 2] })
    .apply(conv_upsample3);
  const conv_upsample4 = tensorflow.layers
    .conv2d({
      kernelSize: 3,
      strides: 1,
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(upsample_4);

  const upsample_5 = tensorflow.layers
    .upSampling2d({ size: [2, 2] })
    .apply(conv_upsample4);
  const conv_upsample5 = tensorflow.layers
    .conv2d({
      kernelSize: 3,
      strides: 1,
      activation: "relu",
      padding: "same",
      filters: 64,
    })
    .apply(upsample_5);

  const conv_upsample = tensorflow.layers
    .conv2dTranspose({
      kernelSize: 1,
      strides: 1,
      activation: "softmax",
      padding: "same",
      filters: imageChannels,
    })
    .apply(conv_upsample5);

  const model = tensorflow.model({
    name: "AdvancedCNN",
    inputs: input,
    //@ts-ignore
    outputs: conv_upsample,
  });

  return model;
};
