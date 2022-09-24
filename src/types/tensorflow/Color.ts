import { Tensor2D } from "@tensorflow/tfjs";

export type Colors = {
  range: { [channel: number]: [number, number] };
  visible: { [channel: number]: boolean };
  color: Tensor2D; // shape: C x 3; [channel_idx, rgb]
};
