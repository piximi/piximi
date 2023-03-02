export enum ModelType {
  None,
  SimpleCNN,
  MobileNet,
  SimpleFCNSegmenter,
  FCNSegmenter,
  UserUploaded,
  CocoSSD,
  StardistVHE,
}

type ModelProps = {
  modelName: string;
  requiredChannels?: number;
  modelType: ModelType;
  src?: string;
  pretrained?: boolean;
  modelArch?: string;
};
export interface DefaultModelProps extends ModelProps {}

export type ClassifierModelProps = DefaultModelProps;

export type SegmenterModelProps = DefaultModelProps;

export const availableClassifierModels: ClassifierModelProps[] = [
  {
    modelName: "SimpleCNN",
    modelType: ModelType.SimpleCNN,
  },
  {
    modelName: "MobileNet",
    requiredChannels: 3,
    modelType: ModelType.MobileNet,
  },
];

export const availableSegmenterModels: SegmenterModelProps[] = [
  {
    modelName: "SimpleFCNSegmenter",
    modelType: ModelType.SimpleFCNSegmenter,
  },
  {
    modelName: "FCNSegmenter",
    modelType: ModelType.FCNSegmenter,
  },
  {
    modelName: "Coco-SSD",
    modelType: ModelType.CocoSSD,
    modelArch: "graph",
  },
  {
    modelName: "Stardist Versitile H&E Nuclei",
    modelType: ModelType.StardistVHE,
    modelArch: "graph",
    pretrained: true,
  },
];
