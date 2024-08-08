import { SequentialClassifier } from "./classification/AbstractClassifier/AbstractClassifier";
import { MobileNet } from "./classification/MobileNet/MobileNet";
import { SimpleCNN } from "./classification/SimpleCNN/SimpleCNN";

export const availableClassifierModels: Array<SequentialClassifier> = [
  new SimpleCNN(),
  new MobileNet(),
];
