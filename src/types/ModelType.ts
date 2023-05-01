export enum ModelArchitecture {
  None,
  SimpleCNN,
  MobileNet,
  SimpleFCNSegmenter,
  FCNSegmenter,
  UserUploaded,
  CocoSSD,
  StardistVHE,
}

export enum ModelTask {
  Classification,
  Segmentation,
}

type ModelProps = {
  modelName: string;
  requiredChannels?: number;
  modelArch: ModelArchitecture;
  src?: string;
  pretrained?: boolean;
  graph: boolean;
};
export interface DefaultModelProps extends ModelProps {}

export type ClassifierModelProps = DefaultModelProps;

export type SegmenterModelProps = DefaultModelProps;

export const availableClassifierModels: ClassifierModelProps[] = [
  {
    modelName: "SimpleCNN",
    modelArch: ModelArchitecture.SimpleCNN,
    graph: false,
  },
  {
    modelName: "MobileNet",
    requiredChannels: 3,
    modelArch: ModelArchitecture.MobileNet,
    graph: false,
  },
];

export const availableSegmenterModels: SegmenterModelProps[] = [
  {
    modelName: "Coco-SSD",
    modelArch: ModelArchitecture.CocoSSD,
    graph: true,
    pretrained: true,
  },
  {
    modelName: "Stardist Versitile H&E Nuclei",
    modelArch: ModelArchitecture.StardistVHE,
    graph: true,
    pretrained: true,
  },
];
