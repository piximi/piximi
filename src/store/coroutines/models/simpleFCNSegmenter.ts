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
export const createSimpleFCNSegmenterModel = (
  inputShape: Shape,
  numClasses: number
) => {
  const imageWidth = inputShape.width;
  const imageHeight = inputShape.height;
  const imageChannels = inputShape.channels;

  //const input = tensorflow.input({ shape: [imageWidth, imageHeight, imageChannels], name: 'Input', });

  const model = tensorflow.sequential();

  model.add(
    tensorflow.layers.conv2d({
      inputShape: [imageWidth, imageHeight, imageChannels],
      kernelSize: 3,
      strides: 1,
      filters: 64,
      activation: "relu",
      kernelInitializer: "varianceScaling",
      padding: "same",
    })
  );
  model.add(
    tensorflow.layers.conv2d({
      kernelSize: 3,
      strides: 1,
      filters: 64,
      activation: "relu",
      kernelInitializer: "varianceScaling",
      padding: "same",
    })
  );
  model.add(
    tensorflow.layers.conv2d({
      kernelSize: 3,
      strides: 1,
      filters: 64,
      activation: "relu",
      kernelInitializer: "varianceScaling",
      padding: "same",
    })
  );
  model.add(
    tensorflow.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] })
  );

  // Second block
  model.add(
    tensorflow.layers.conv2d({
      kernelSize: 3,
      strides: 1,
      filters: 64,
      activation: "relu",
      kernelInitializer: "varianceScaling",
      padding: "same",
    })
  );
  model.add(
    tensorflow.layers.conv2d({
      kernelSize: 3,
      strides: 1,
      filters: 64,
      activation: "relu",
      kernelInitializer: "varianceScaling",
      padding: "same",
    })
  );
  model.add(
    tensorflow.layers.conv2d({
      kernelSize: 3,
      strides: 1,
      filters: 64,
      activation: "relu",
      kernelInitializer: "varianceScaling",
      padding: "same",
    })
  );
  model.add(
    tensorflow.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] })
  );

  // Embedding
  model.add(
    tensorflow.layers.conv2d({
      kernelSize: 1,
      strides: 1,
      filters: numClasses,
      activation: "relu",
      kernelInitializer: "varianceScaling",
      padding: "same",
    })
  );

  //const fcn_13 = tensorflow.layers.conv2d({ kernelSize: [7, 7], strides: [1, 1], activation: 'relu', padding: 'same', filters: 4096 }).apply(fcn_12);
  //const fcn_13_0 = tensorflow.layers.conv2d({ kernelSize: [1, 1], strides: [1, 1], activation: 'relu', padding: 'same', filters: numClasses }).apply(fcn_4);
  //const drop_0 = tensorflow.layers.dropout( { rate: .5 } ).apply(fcn_13);

  //const fcn_15 = tensorflow.layers.conv2d({ kernelSize: [1, 1], strides: [1, 1], activation: 'relu', padding: 'same', filters: this._classes }).apply(fcn_13_0);

  // const upsample_1 = tensorflow.layers.upSampling2d( { size: [2, 2] } ).apply(fcn_13_0);
  // const conv_upsample1 = tensorflow.layers.conv2d( { kernelSize: 3, strides: 1, activation: 'relu', padding: 'same', filters: 64 }).apply(upsample_1);

  model.add(
    tensorflow.layers.upSampling2d({
      size: [2, 2],
    })
  );
  model.add(
    tensorflow.layers.conv2d({
      kernelSize: 3,
      strides: 1,
      filters: 64,
      activation: "relu",
      kernelInitializer: "varianceScaling",
      padding: "same",
    })
  );

  model.add(
    tensorflow.layers.upSampling2d({
      size: [2, 2],
    })
  );
  model.add(
    tensorflow.layers.conv2d({
      kernelSize: 3,
      strides: 1,
      filters: 64,
      activation: "relu",
      kernelInitializer: "varianceScaling",
      padding: "same",
    })
  );

  // const upsample_2 = tensorflow.layers.upSampling2d( { size: [2, 2] } ).apply(conv_upsample1);
  // const conv_upsample2 = tensorflow.layers.conv2d( { kernelSize: 3, strides: 1, activation: 'relu', padding: 'same', filters: 64 }).apply(upsample_2);

  // const upsample_3 = tensorflow.layers.upSampling2d( { size: [2, 2] } ).apply(conv_upsample2);
  // const conv_upsample3 = tensorflow.layers.conv2d( { kernelSize: 3, strides: 1, activation: 'relu', padding: 'same', filters: 64 }).apply(upsample_3);

  // const upsample_4 = tensorflow.layers.upSampling2d( { size: [2, 2] } ).apply(conv_upsample3);
  // const conv_upsample4 = tensorflow.layers.conv2d( { kernelSize: 3, strides: 1, activation: 'relu', padding: 'same', filters: 64 }).apply(upsample_4);

  // const upsample_5 = tensorflow.layers.upSampling2d( { size: [2, 2] } ).apply(conv_upsample4);
  // const conv_upsample5 = tensorflow.layers.conv2d( { kernelSize: 3, strides: 1, activation: 'relu', padding: 'same', filters: 64 }).apply(upsample_5);

  //const upsample_6 = tensorflow.layers.upSampling2d( { size: [2, 2], padding: 'same' } ).apply(fcn_15);
  //const conv_upsample = tensorflow.layers.conv2dTranspose( { kernelSize: 1, strides: 1, activation: 'softmax', padding: 'same', filters: imageChannels }).apply(conv_upsample2);

  model.add(
    tensorflow.layers.conv2dTranspose({
      kernelSize: 1,
      strides: 1,
      filters: imageChannels,
      activation: "softmax",
      kernelInitializer: "varianceScaling",
      padding: "same",
    })
  );

  //@ts-ignore
  //const model = tensorflow.model( { name: 'SimpleFCN', inputs: input, outputs: conv_upsample } );

  return model;
};
