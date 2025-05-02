import { AlertType } from "./enums";
import { AlertState } from "./types";

export const APPLICATION_COLORS = {
  classifierList: "#DCF3F450",
  segmenterList: "#E9E5FA50",
  borderColor: "#0000001f",
  highlightColor: "#0000000a",
};

export const dimensions = {
  leftDrawerWidth: 256,
  toolDrawerWidth: 36,
  stagePaddingX: 50,
  stageInfoHeight: 21,
};

export const defaultAlert: AlertState = {
  alertType: AlertType.Info,
  name: "None",
  description: "default state",
  visible: false,
};

export const mobileBreakpoints = ["xs", "sm"];
