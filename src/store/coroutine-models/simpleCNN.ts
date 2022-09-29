import { sequential, layers } from "@tensorflow/tfjs";
import { Shape } from "../../types/Shape";

/**
 * Creates simple convolutional neural network, for example used for mnist classification problem
 * from: https://codelabs.developers.google.com/codelabs/tfjs-training-classfication/
 */
export const createSimpleCNN = (inputShape: Shape, numClasses: number) => {
  const imageWidth = inputShape.width;
  const imageHeight = inputShape.height;
  const imageChannels = inputShape.channels;

  const model = sequential();

  // In the first layer of our convolutional neural network we have
  // to specify the input shape. Then we specify some parameters for
  // the convolution operation that takes place in this layer.
  model.add(
    layers.conv2d({
      // inputShape: [imageWidth, imageHeight, imageChannels],
      inputShape: [imageHeight, imageWidth, imageChannels],
      kernelSize: 5,
      filters: 8,
      strides: 1,
      activation: "relu",
      kernelInitializer: "varianceScaling",
    })
  );

  // The MaxPooling layer acts as a sort of downsampling using max values
  // in a region instead of averaging.
  model.add(layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] }));

  // Repeat another conv2d + maxPooling stack.
  // Note that we have more filters in the convolution.
  model.add(
    layers.conv2d({
      kernelSize: 5,
      filters: 16,
      strides: 1,
      activation: "relu",
      kernelInitializer: "varianceScaling",
    })
  );
  model.add(layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] }));

  // Now we flatten the output from the 2D filters into a 1D vector to prepare
  // it for input into our last layer. This is common practice when feeding
  // higher dimensional data to a final classification output layer.
  model.add(layers.flatten());

  // Our last layer is a dense layer which has `numClasses` output units, one for each output class
  model.add(
    layers.dense({
      units: numClasses,
      kernelInitializer: "varianceScaling",
      activation: "softmax",
    })
  );

  return model;
};
