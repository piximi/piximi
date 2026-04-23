import { Category, Kind } from "./types";

export const UNKNOWN_IMAGE_CATEGORY_ID: string =
  "00000000-0000-0000-0000-000000000000";
export const UNKNOWN_KIND_ID: string = "00000000-1111-0000-0000-000000000000";
export const UNKNOWN_KIND_CATEGORY_ID: string =
  "00000000-0000-1111-0000-000000000000";
export const UNKNOWN_NAME: string = "Unknown";

export const CATEGORY_COLORS = {
  black: "#000000",
  indianred: "#C84C4C",
  red: "#E60000",
  darkred: "#8B0000",
  mediumvioletred: "#C71585",
  palevioletred: "#DB7093",
  sherpablue: "#004949",
  darkcyan: "#009292",
  indigo: "#490092",
  navyblue: "#006ddb",
  heliotrope: "#b66dff",
  mayablue: "#6db6ff",
  columbiablue: "#b6dbff",
  olive: "#924900",
  mangotango: "#db6d00",
  green: "#237700",
  citrus: "#a89d00",
};

//the default colors assigned to a loaded image
export const DEFAULT_COLORS: Array<[number, number, number]> = [
  [1, 0, 0], // red
  [0, 1, 0], // green
  [0, 0, 1], // blue
  [1, 1, 0], // yellow
  [0, 1, 1], // cyan
  [1, 0, 1], // magneta
];

export const UNKNOWN_IMAGE_CATEGORY_COLOR = "#AAAAAA";
export const UNKNOWN_ANNOTATION_CATEGORY_COLOR = "#920000";

export const UNKNOWN_IMAGE_CATEGORY: Category = {
  id: UNKNOWN_IMAGE_CATEGORY_ID,
  name: UNKNOWN_NAME,
  type: "image",
  isUnknown: true,
  color: UNKNOWN_IMAGE_CATEGORY_COLOR,
};

export const UNKNOWN_KIND: Kind = {
  id: UNKNOWN_KIND_ID,
  name: UNKNOWN_NAME,
  unknownCategoryId: UNKNOWN_KIND_CATEGORY_ID,
};
export const UNKNOWN_KIND_CATEGORY: Category = {
  id: UNKNOWN_KIND_CATEGORY_ID,
  name: UNKNOWN_NAME,
  type: "annotation",
  kindId: UNKNOWN_KIND_ID,
  isUnknown: true,
  color: UNKNOWN_ANNOTATION_CATEGORY_COLOR,
};
