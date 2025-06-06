import { AlertType } from "./enums";
import { AlertState } from "./types";

export const APPLICATION_COLORS = {
  classifierList: "#DCF3F450",
  segmenterList: "#E9E5FA50",
  borderColor: "#0000001f",
  highlightColor: "#0000000a",
};

export const DIMENSIONS = {
  leftDrawerWidth: 256,
  toolDrawerWidth: 36,
  stagePaddingX: 50,
  stageInfoHeight: 21,
};

export const DEFAULT_ALERT: AlertState = {
  alertType: AlertType.Info,
  name: "None",
  description: "default state",
  visible: false,
};

export const MOBILE_BREAKPOINTS = ["xs", "sm"];

export const DEFAULT_GRID_ITEM_WIDTH = 220;
export const GRID_GAP = 18;
