import * as tensorflow from "@tensorflow/tfjs";

export const changeInputShape = async (
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
