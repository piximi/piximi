import { Tensor2D } from "@tensorflow/tfjs";

type ColorsMeta = {
  range: { [channel: number]: [number, number] };
  visible: { [channel: number]: boolean };
};

export type Colors = {
  color: Tensor2D; // shape: C x 3; [channel_idx, rgb]
} & ColorsMeta;

export type ColorsRaw = {
  color: [number, number, number][];
} & ColorsMeta;
