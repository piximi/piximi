import { SequentialClassifier } from "./AbstractClassifier/AbstractClassifier";
import { MobileNet } from "./MobileNet/MobileNet";
import { SimpleCNN } from "./SimpleCNN/SimpleCNN";

export const availableClassifierModels: Array<SequentialClassifier> = [
  new SimpleCNN(),
  new MobileNet(),
];
