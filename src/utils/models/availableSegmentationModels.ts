import { Segmenter } from "./AbstractSegmenter";
import { CellposeNew } from "./Cellpose";
import { CocoSSDNew } from "./CocoSSD";
import { FullyConvolutionalSegmenter } from "./FullyConvolutionalSegmenter";
import { StardistVHENew } from "./StardistVHE";

export const availableSegmenterModels: Array<Segmenter> = [
  new FullyConvolutionalSegmenter(),
  new CellposeNew(),
  new StardistVHENew(),
  new CocoSSDNew(),
];
