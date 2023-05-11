import {
  Sequential,
  sequential,
  layers,
  serialization,
  initializers,
} from "@tensorflow/tfjs";

// inputShape: [W,H,C]
export const changeInputShape = (
  model: Sequential,
  inputShape: [number, number, number],
  defaultInputShape: [number, number, number]
) => {
  const newModel = sequential();

  newModel.add(layers.inputLayer({ inputShape: inputShape }));

  if (inputShape[2] !== defaultInputShape[2]) {
    newModel.add(
      layers.conv2d({
        inputShape,
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
      })
    );
  }

  const map = serialization.SerializationMap.getMap().classNameMap;
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
