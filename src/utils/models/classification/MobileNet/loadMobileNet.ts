import {
  loadLayersModel,
  sequential,
  layers,
  initializers,
  LayersModel,
  Sequential,
  serialization,
} from "@tensorflow/tfjs";
import { isEqual } from "lodash";
import { Shape } from "store/data/types";

const copyLayer = (
  fromModel: LayersModel,
  toModel: Sequential,
  layerIdx: number,
) => {
  const sourceLayer = fromModel.layers[layerIdx];
  const classMap = serialization.SerializationMap.getMap().classNameMap;
  const className: string = sourceLayer.getClassName();
  const [cls, fromConfig] = classMap[className];
  const cfg = sourceLayer.getConfig();

  const newLayer = fromConfig(cls, cfg) as typeof sourceLayer;

  // new weights initialized on add
  toModel.add(newLayer);

  // replace newly initialized weights, with weights of the layer we're
  // copying over; no need to dispose the newly initialized weights,
  // they are disposed internally by tf
  newLayer.setWeights(sourceLayer.getWeights());
};

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
  if (numClasses <= 0) {
    throw new Error("Must have at least one labeled class");
  }

  const input_shape: [number, number, number] = [
    inputShape.width,
    inputShape.height,
    inputShape.channels,
  ];

  const mobilenet = await loadLayersModel(resource);

  const model = sequential();

  // if we need to change the input shape
  if (!isEqual(input_shape, defaultInputShape)) {
    mobilenet.layers[0].dispose();

    model.add(layers.inputLayer({ inputShape: input_shape }));

    if (input_shape[2] !== defaultInputShape[2]) {
      model.add(
        layers.conv2d({
          inputShape: input_shape,
          kernelSize: 3,
          filters: defaultInputShape[2],
          strides: 2,
          activation: "linear",
          kernelInitializer: initializers.varianceScaling({
            distribution: "uniform",
            mode: "fanAvg",
            scale: 1,
            seed: undefined,
          }),
          dilationRate: [1, 1],
          useBias: false,
          biasInitializer: "zeros",
        }),
      );
    }
  } else {
    copyLayer(mobilenet, model, 0);
  }

  for (let i = 1; i < mobilenet.layers.length; i++) {
    copyLayer(mobilenet, model, i);

    if (mobilenet.layers[i].name === lastLayerName) {
      break;
    }
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
      }),
    );

    model.add(layers.dropout({ rate: 0.001 }));

    model.add(
      layers.conv2d({
        filters: numClasses,
        kernelSize: [1, 1],
      }),
    );

    model.add(
      layers.reshape({
        targetShape: [numClasses],
      }),
    );

    model.add(
      layers.activation({
        activation: "softmax",
      }),
    );
  }

  mobilenet.dispose();

  return model;
};
