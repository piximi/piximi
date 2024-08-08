import { Segmenter } from "./segmentation/AbstractSegmenter";
import { Cellpose } from "./segmentation/Cellpose";
import { CocoSSD } from "./segmentation/CocoSSD";
import { FullyConvolutionalSegmenter } from "./segmentation/FullyConvolutionalSegmenter";
import { Glas } from "./segmentation/Glas";
import { StardistVHE, StardistFluo } from "./segmentation/Stardist";

export const availableSegmenterModels: Array<Segmenter> = [
  new FullyConvolutionalSegmenter(),
  new Cellpose(),
  new StardistVHE(),
  new StardistFluo(),
  new CocoSSD(),
  new Glas(),
];
