import * as tensorflow from "@tensorflow/tfjs";
import { Shape } from "../../../types/Shape";
import { changeInputShape } from "./changeInputShape";

/**
 *
 * @param inputShape array of number specifying the input shape [imageWidth, imageHeight, imageChannels]
 * @param numClasses shape of the output layer (i.e. number of classes to predict)
 * @param freeze flag to freeze the layers in the model, i.e. not training them
 * @param useCustomTopLayer flag to use a custom top layer specific to the shape of your training
 * @returns tensorflow.sequential model
 */
export const createMobileNet = async (
  input_shape: Shape,
  numClasses: number,
  freeze: boolean = true,
  useCustomTopLayer: boolean = true
) => {
  const imageWidth = input_shape.width;
  const imageHeight = input_shape.height;

  // the number of input channels cannot be changed
  const inputShape: number[] = [imageWidth, imageHeight, 3];

  const resource =
    "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

  const mobilenet = await tensorflow.loadLayersModel(resource);

  const layerName = "conv_pw_13_relu";

  const backbone = tensorflow.sequential();
  for (const l of mobilenet.layers) {
    backbone.add(l);
    if (l.name === layerName) {
      break;
    }
  }

  let model = backbone;
  if (inputShape !== [224, 224, 3]) {
    model = await changeInputShape(model, inputShape);
  }

  if (freeze) {
    model.layers.forEach(function (l) {
      l.trainable = false;
    });
  }

  if (useCustomTopLayer) {
    model.add(tensorflow.layers.globalAveragePooling2d({}));

    const numfeat = model.layers[model.layers.length - 1].outputShape[1];
    model.add(
      tensorflow.layers.reshape({
        targetShape: [1, 1, numfeat as number],
      })
    );

    model.add(tensorflow.layers.dropout({ rate: 0.001 }));

    model.add(
      tensorflow.layers.conv2d({
        filters: numClasses,
        kernelSize: [1, 1],
      })
    );

    model.add(
      tensorflow.layers.reshape({
        targetShape: [numClasses],
      })
    );

    model.add(
      tensorflow.layers.activation({
        activation: "softmax",
      })
    );
  }
  return model;
};
