import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";
import { MobileNet } from "utils/common/models/MobileNet/MobileNet";
import { SimpleCNN } from "utils/common/models/SimpleCNN/SimpleCNN";
import { StardistVHE } from "utils/common/models/StardistVHE/StardistVHE";
import { FullyConnectedSegmenter } from "utils/common/models/FullyConnectedSegmenter/FullyConnectedSegmenter";
import { CocoSSD } from "utils/common/models/CocoSSD/CocoSSD";

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

export const availableClassifierModels: Array<SequentialClassifier> = [
  new SimpleCNN(),
  new MobileNet(),
];

export const availableSegmenterModels: Array<Segmenter> = [
  new FullyConnectedSegmenter(),
  new CocoSSD(),
  new StardistVHE(),
];
