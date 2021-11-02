import { ZoomModeType } from "./ZoomModeType";

export type ZoomToolOptionsType = {
  automaticCentering: boolean;
  mode: ZoomModeType;
  scale: number;
  toActualSize: boolean;
  toFit: boolean;
};
