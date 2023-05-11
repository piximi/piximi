import { loadLayersModel, sequential, layers } from "@tensorflow/tfjs";
import _ from "lodash";

import { Shape } from "types/Shape";
import { changeInputShape } from "../utils/changeInputShape";

/**
 *
 * @param inputShape array of number specifying the input shape [imageWidth, imageHeight, imageChannels]
 * @param numClasses shape of the output layer (i.e. number of classes to predict)
 * @param resource a url point to the model.json file
 * @param freeze flag to freeze the layers in the model, i.e. not training them
 * @param useCustomTopLayer flag to use a custom top layer specific to the shape of your training
 * @param defaultInputShape the input shape the model pointed to by resource expects
 * @param lastLayerName the terminal layer of the provided model from which to extract outputs (or add a custom layer onto)
 * @returns tensorflow.sequential model
 */
export const createMobileNet = async ({
  inputShape,
  numClasses,
  resource,
  freeze,
  useCustomTopLayer,
  defaultInputShape,
  lastLayerName,
}: {
  inputShape: Shape;
  numClasses: number;
  resource: string;
  freeze: boolean;
  useCustomTopLayer: boolean;
  defaultInputShape: [number, number, number];
  lastLayerName: string;
}) => {
  const input_shape: [number, number, number] = [
    inputShape.width,
    inputShape.height,
    inputShape.channels,
  ];

  // TODO - segmenter: lots of dispose() needed to be done throughout here, I think

  const mobilenet = await loadLayersModel(resource);

  const backbone = sequential();
  for (const l of mobilenet.layers) {
    backbone.add(l);
    if (l.name === lastLayerName) {
      break;
    }
  }

  let model = backbone;
  if (!_.isEqual(input_shape, defaultInputShape)) {
    model = changeInputShape(model, input_shape, defaultInputShape);
  }

  if (freeze) {
    model.layers.forEach(function (l) {
      l.trainable = false;
    });
  }

  if (useCustomTopLayer) {
    model.add(layers.globalAveragePooling2d({}));

    const numfeat = model.layers.at(-1)!.outputShape[1];
    model.add(
      layers.reshape({
        targetShape: [1, 1, numfeat as number],
      })
    );

    model.add(layers.dropout({ rate: 0.001 }));

    model.add(
      layers.conv2d({
        filters: numClasses,
        kernelSize: [1, 1],
      })
    );

    model.add(
      layers.reshape({
        targetShape: [numClasses],
      })
    );

    model.add(
      layers.activation({
        activation: "softmax",
      })
    );
  }
  return model;
};
