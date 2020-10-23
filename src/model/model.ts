import * as tensorflow from "@tensorflow/tfjs";
import * as _ from "lodash";

const changeInputShape = async (
  model: tensorflow.Sequential,
  inputShape: number[]
) => {
  const newModel = tensorflow.sequential();
  newModel.add(tensorflow.layers.inputLayer({ inputShape: inputShape }));
  const map = tensorflow.serialization.SerializationMap.getMap().classNameMap;
  for (let i = 1; i < model.layers.length; i++) {
    const layer = model.layers[i];
    const className: string = layer.getClassName();
    const [cls, fromConfig] = map[className];
    let cfg = layer.getConfig();
    const newlayer = fromConfig(cls, cfg);
    // @ts-ignore
    newModel.add(newlayer);
    // @ts-ignore
    newlayer.setWeights(layer.getWeights());
  }

  return newModel;
};

export const createMobileNet = async (
  classes: number,
  inputShape: number[] = [224, 224, 3],
  freeze: boolean = false,
  includeTop: boolean = true
) => {
  const resource =
    "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

  const mobilenet = await tensorflow.loadLayersModel(resource);

  const layerName = "conv_pw_13_relu";
  const layer = mobilenet.getLayer(layerName);

  const backbone = tensorflow.sequential();
  for (const l of mobilenet.layers) {
    backbone.add(l);
    if (l.name == layerName) {
      break;
    }
  }

  let model = backbone;
  if (inputShape != [224, 224, 3]) {
    model = await changeInputShape(model, inputShape);
  }

  if (freeze) {
    model.layers.forEach(function (l) {
      l.trainable = false;
    });
  }

  if (includeTop) {
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
        filters: classes,
        kernelSize: [1, 1],
      })
    );

    model.add(
      tensorflow.layers.reshape({
        targetShape: [classes],
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

export const createModel = async (
  numberOfClasses: number,
  inputShape: number[]
) => {
  const model = tensorflow.sequential();
  if (!inputShape) {
    inputShape = [224, 224, 3];
  }
  model.add(
    tensorflow.layers.conv2d({
      inputShape: inputShape,
      kernelSize: 3,
      filters: 16,
      activation: "relu",
      kernelInitializer: "heNormal",
    })
  );
  model.add(tensorflow.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
  model.add(
    tensorflow.layers.conv2d({
      kernelSize: 3,
      filters: 32,
      activation: "relu",
      kernelInitializer: "heNormal",
    })
  );
  model.add(tensorflow.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
  model.add(
    tensorflow.layers.conv2d({
      kernelSize: 3,
      filters: 32,
      activation: "relu",
      kernelInitializer: "heNormal",
    })
  );
  model.add(tensorflow.layers.flatten());
  model.add(
    tensorflow.layers.dense({
      units: 32,
      activation: "relu",
      kernelInitializer: "heNormal",
    })
  );
  model.add(
    tensorflow.layers.dense({
      units: numberOfClasses,
      activation: "relu",
      kernelInitializer: "heNormal",
    })
  );
  model.add(
    tensorflow.layers.dense({ units: numberOfClasses, activation: "softmax" })
  );
  return model;
};

export const getArgs = (batchSize: number, epochs: number) => {
  const arg = {
    batchSize: batchSize,
    callbacks: {
      onTrainBegin: async (logs?: tensorflow.Logs | undefined) => {
        console.log(`onTrainBegin`);
      },
      onTrainEnd: async (logs?: tensorflow.Logs | undefined) => {},
      onEpochBegin: async (
        epoch: number,
        logs?: tensorflow.Logs | undefined
      ) => {
        console.log(`onEpochBegin ${epoch}`);
      },
      onEpochEnd: async (epoch: number, logs?: tensorflow.Logs | undefined) => {
        if (logs) {
          console.log(`onEpochEnd ${epoch}, loss: ${logs.loss}`);
        }
        // if (stopTraining) {
        //   model.stopTraining = true;
        // }
      },
      onBatchBegin: async (
        batch: number,
        logs?: tensorflow.Logs | undefined
      ) => {
        console.log(`onBatchBegin ${batch}`);
      },
      onBatchEnd: async (batch: number, logs?: tensorflow.Logs | undefined) => {
        console.log(`onBatchEnd ${batch}`);
      },
    },
    epochs: epochs,
  };
  return getArgs;
};
