import { MobileNet } from "utils/common/models/MobileNet/MobileNet";
import { SimpleCNN } from "utils/common/models/SimpleCNN/SimpleCNN";

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

export enum ModelStatus {
  Uninitialized,
  InitFit,
  Loading,
  Training,
  Trained,
  Predicting,
  Suggesting,
  Evaluating,
}

type ModelProps = {
  modelName: string;
  requiredChannels?: number;
  modelArch: ModelArchitecture;
  graph: boolean; // Model Format, Graph if true, Layers if false
  src?: string;
  pretrained?: boolean;
};

export interface DefaultModelProps extends ModelProps {}

export type ClassifierModelProps = DefaultModelProps;

export type SegmenterModelProps = DefaultModelProps;

export const concreteClassifierModels = [new SimpleCNN(), new MobileNet()];

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
