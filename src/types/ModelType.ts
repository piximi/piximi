import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";
import { MobileNet } from "utils/common/models/MobileNet/MobileNet";
import { SimpleCNN } from "utils/common/models/SimpleCNN/SimpleCNN";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";

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

export const concreteClassifierModels: Array<SequentialClassifier> = [
  new SimpleCNN(),
  new MobileNet(),
];

// TODO - segmenter: Replace these with concrete classes when Segmenter becomes abstract
export const availableSegmenterModels: Array<Segmenter> = [
  new Segmenter(ModelArchitecture.CocoSSD, {
    name: "Coco-SSD",
    task: ModelTask.Segmentation,
    graph: true,
    pretrained: true,
    trainable: false,
  }),
  new Segmenter(ModelArchitecture.StardistVHE, {
    name: "Stardist Versitile H&E Nuclei",
    task: ModelTask.Segmentation,
    graph: true,
    pretrained: true,
    trainable: false,
  }),
];
