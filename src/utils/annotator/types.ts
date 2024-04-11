import { ZoomMode } from "./enums";

export type Point = {
  x: number;
  y: number;
};
export type Edge = {
  p1: Point;
  p2: Point;
};
export type ColorAdjustmentOptionsType = {
  blackPoint: number;
  brightness: number;
  contrast: number;
  exposure: number;
  highlights: number;
  hue: number;
  saturation: number;
  shadows: number;
  vibrance: number;
};

export type ZoomToolOptionsType = {
  automaticCentering: boolean;
  mode: ZoomMode;
  scale: number;
  toActualSize: boolean;
  toFit: boolean;
};

export type ToolOptionsStateType = {
  colorAdjustment: ColorAdjustmentOptionsType;
  zoom: ZoomToolOptionsType;
};
