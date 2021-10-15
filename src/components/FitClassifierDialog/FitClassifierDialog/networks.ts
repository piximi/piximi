import * as tensorflow from "@tensorflow/tfjs";

/***
 * Creates convolutional neural network for mnist classification problem
 * from: https://codelabs.developers.google.com/codelabs/tfjs-training-classfication/
 */
export const getMnistModel = () => {
  const model = tensorflow.sequential();

  const IMAGE_WIDTH = 28;
  const IMAGE_HEIGHT = 28;
  const IMAGE_CHANNELS = 1;

  // In the first layer of our convolutional neural network we have
  // to specify the input shape. Then we specify some parameters for
  // the convolution operation that takes place in this layer.
  model.add(
    tensorflow.layers.conv2d({
      inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, IMAGE_CHANNELS],
      kernelSize: 5,
      filters: 8,
      strides: 1,
      activation: "relu",
      kernelInitializer: "varianceScaling",
    })
  );

  // The MaxPooling layer acts as a sort of downsampling using max values
  // in a region instead of averaging.
  model.add(
    tensorflow.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] })
  );

  // Repeat another conv2d + maxPooling stack.
  // Note that we have more filters in the convolution.
  model.add(
    tensorflow.layers.conv2d({
      kernelSize: 5,
      filters: 16,
      strides: 1,
      activation: "relu",
      kernelInitializer: "varianceScaling",
    })
  );
  model.add(
    tensorflow.layers.maxPooling2d({ poolSize: [2, 2], strides: [2, 2] })
  );

  // Now we flatten the output from the 2D filters into a 1D vector to prepare
  // it for input into our last layer. This is common practice when feeding
  // higher dimensional data to a final classification output layer.
  model.add(tensorflow.layers.flatten());

  // Our last layer is a dense layer which has 10 output units, one for each
  // output class (i.e. 0, 1, 2, 3, 4, 5, 6, 7, 8, 9).
  const NUM_OUTPUT_CLASSES = 10;
  model.add(
    tensorflow.layers.dense({
      units: NUM_OUTPUT_CLASSES,
      kernelInitializer: "varianceScaling",
      activation: "softmax",
    })
  );

  return model;
};

/**
 * Creates a convolutional neural network (Convnet) for the MNIST data.
 *
 * @returns {tensorflow.Model} An instance of tensorflow.Model.
 */
export const createModel = async (numberOfClasses: number) => {
  // Create a sequential neural network model. tensorflow.sequential provides an API
  // for creating "stacked" models where the output from one layer is used as
  // the input to the next layer.
  const model = tensorflow.sequential();

  // The first layer of the convolutional neural network plays a dual role:
  // it is both the input layer of the neural network and a layer that performs
  // the first convolution operation on the input. It receives the 28x28 pixels
  // black and white images. This input layer uses 16 filters with a kernel size
  // of 5 pixels each. It uses a simple RELU activation function which pretty
  // much just looks like this: __/
  model.add(
    tensorflow.layers.conv2d({
      inputShape: [224, 224, 3],
      kernelSize: 3,
      filters: 16,
      activation: "relu",
    })
  );

  // After the first layer we include a MaxPooling layer. This acts as a sort of
  // downsampling using max values in a region instead of averaging.
  // https://www.quora.com/What-is-max-pooling-in-convolutional-neural-networks
  model.add(tensorflow.layers.maxPooling2d({ poolSize: 2, strides: 2 }));

  // Our third layer is another convolution, this time with 32 filters.
  model.add(
    tensorflow.layers.conv2d({ kernelSize: 3, filters: 32, activation: "relu" })
  );

  // Max pooling again.
  model.add(tensorflow.layers.maxPooling2d({ poolSize: 2, strides: 2 }));

  // Add another conv2d layer.
  model.add(
    tensorflow.layers.conv2d({ kernelSize: 3, filters: 32, activation: "relu" })
  );

  // Now we flatten the output from the 2D filters into a 1D vector to prepare
  // it for input into our last layer. This is common practice when feeding
  // higher dimensional data to a final classification output layer.
  model.add(tensorflow.layers.flatten({}));

  model.add(tensorflow.layers.dense({ units: 64, activation: "relu" }));

  // Our last layer is a dense layer which has 10 output units, one for each
  // output class (i.e. 0, 1, 2, 3, 4, 5, 6, 7, 8, 9). Here the classes actually
  // represent numbers, but it's the same idea if you had classes that
  // represented other entities like dogs and cats (two output classes: 0, 1).
  // We use the softmax function as the activation for the output layer as it
  // creates a probability distribution over our 10 classes so their output
  // values sum to 1.
  model.add(
    tensorflow.layers.dense({ units: numberOfClasses, activation: "softmax" })
  );

  return model;
};

export const createMobileNet = async (numberOfClasses: number) => {
  const resource =
    "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

  const mobilenet = await tensorflow.loadLayersModel(resource);

  const layer = mobilenet.getLayer("conv_pw_13_relu");

  const backbone = tensorflow.model({
    inputs: mobilenet.inputs,
    outputs: layer.output,
  });

  const a = tensorflow.layers.globalAveragePooling2d({
    inputShape: backbone.outputs[0].shape.slice(1),
  });

  const b = tensorflow.layers.reshape({
    targetShape: [1, 1, backbone.outputs[0].shape[3]],
  });

  const c = tensorflow.layers.dropout({
    rate: 0.001,
  });

  const d = tensorflow.layers.conv2d({
    filters: numberOfClasses,
    kernelSize: [1, 1],
  });

  const e = tensorflow.layers.reshape({
    targetShape: [numberOfClasses],
  });

  const f = tensorflow.layers.activation({
    activation: "softmax",
  });

  const config = {
    layers: [...backbone.layers, a, b, c, d, e, f],
  };

  const model = tensorflow.sequential(config);
  return model;
};
