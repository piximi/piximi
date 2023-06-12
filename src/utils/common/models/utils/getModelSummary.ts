import { LayersModel } from "@tensorflow/tfjs";

export interface ModelLayerData {
  layerName: string;
  outputShape: string;
  parameters: number;
  trainable: string;
}

export const getLayersModelSummary = (model: LayersModel): ModelLayerData[] => {
  const modelSummary: ModelLayerData[] = [];

  for (let i = 0; i < model.layers.length; i++) {
    const layer = model.layers[i];

    const outputShape = layer.outputShape;
    const parameters = layer.countParams();
    const layerName = layer.name;
    const trainable = layer.trainable;

    const layerSummary: ModelLayerData = {
      layerName,
      outputShape: String(outputShape).slice(1),
      parameters: parameters,
      trainable: String(trainable),
    };

    modelSummary.push(layerSummary);
  }
  return modelSummary;
};
