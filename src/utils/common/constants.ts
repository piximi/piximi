import { AlertType, ImageSortKey } from "./enums";
import { AlertState, ImageSortKeyType } from "./types";

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

export const APPLICATION_COLORS = {
  classifierList: "#DCF3F450",
  segmenterList: "#E9E5FA50",
  borderColor: "#0000001f",
  highlightColor: "#0000000a",
};

export const dimensions = {
  leftDrawerWidth: 256,
  toolDrawerWidth: 56,
  annotatorToolOptionsWidth: 200,
  stagePaddingX: 50,
  stageInfoHeight: 21,
};

export const defaultAlert: AlertState = {
  alertType: AlertType.Info,
  name: "None",
  description: "default state",
  visible: false,
};

export const defaultImageSortKey: ImageSortKeyType = {
  imageSortKeyName: "None",
  imageSortKey: ImageSortKey.None,
  comparerFunction: (a, b) => 0,
  objectType: "All",
};

export const availableImageSortKeys: ImageSortKeyType[] = [
  {
    imageSortKeyName: "File name",
    imageSortKey: ImageSortKey.FileName,
    comparerFunction: (a, b) => a.name.localeCompare(b.name),
    objectType: "Images",
  },
  {
    imageSortKeyName: "Category",
    imageSortKey: ImageSortKey.Category,
    comparerFunction: (a, b) => a.category.name.localeCompare(b.category.name),
    objectType: "All",
  },
  {
    imageSortKeyName: "Random",
    imageSortKey: ImageSortKey.Random,
    comparerFunction: (a, b) => (Math.round(Math.random() * 10) >= 5 ? 1 : -1),
    objectType: "All",
  },
  {
    imageSortKeyName: "Image",
    imageSortKey: ImageSortKey.Image,
    comparerFunction: (a, b) => a.name.localeCompare(b.name),
    objectType: "Annotations",
  },
];

export const mobileBreakpoints = ["xs", "sm"];
