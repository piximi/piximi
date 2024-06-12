import { Segmenter } from "./AbstractSegmenter";
import { Cellpose } from "./Cellpose";
import { CocoSSD } from "./CocoSSD";
import { FullyConvolutionalSegmenter } from "./FullyConvolutionalSegmenter";
import { Glas } from "./Glas/Glas";
import { StardistVHE, StardistFluo } from "./Stardist";

export const availableSegmenterModels: Array<Segmenter> = [
  new FullyConvolutionalSegmenter(),
  new Cellpose(),
  new StardistVHE(),
  new StardistFluo(),
  new CocoSSD(),
  new Glas(),
];
