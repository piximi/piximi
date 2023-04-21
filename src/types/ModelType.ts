export enum TheModel {
  None,
  SimpleCNN,
  MobileNet,
  SimpleFCNSegmenter,
  FCNSegmenter,
  UserUploaded,
  CocoSSD,
  StardistVHE,
}

export enum ModelArchitecture {
  Graph,
  Layers,
}

type ModelProps = {
  modelName: string;
  requiredChannels?: number;
  theModel: TheModel;
  src?: string;
  pretrained?: boolean;
  modelArch: ModelArchitecture;
};
export interface DefaultModelProps extends ModelProps {}

export type ClassifierModelProps = DefaultModelProps;

export type SegmenterModelProps = DefaultModelProps;

export const availableClassifierModels: ClassifierModelProps[] = [
  {
    modelName: "SimpleCNN",
    theModel: TheModel.SimpleCNN,
    modelArch: ModelArchitecture.Layers,
  },
  {
    modelName: "MobileNet",
    requiredChannels: 3,
    theModel: TheModel.MobileNet,
    modelArch: ModelArchitecture.Layers,
  },
];

export const availableSegmenterModels: SegmenterModelProps[] = [
  {
    modelName: "Coco-SSD",
    theModel: TheModel.CocoSSD,
    modelArch: ModelArchitecture.Graph,
    pretrained: true,
  },
  {
    modelName: "Stardist Versitile H&E Nuclei",
    theModel: TheModel.StardistVHE,
    modelArch: ModelArchitecture.Graph,
    pretrained: true,
  },
];
