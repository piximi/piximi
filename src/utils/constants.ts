import { AlertType, ImageSortKey } from "./enums";
import { AlertState, ImageSortKeyType } from "./types";

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

export const defaultImageSortKey: ImageSortKeyType = {
  imageSortKeyName: "None",
  imageSortKey: ImageSortKey.None,
  comparerFunction: (_a, _b) => 0,
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
    comparerFunction: (_a, _b) =>
      Math.round(Math.random() * 10) >= 5 ? 1 : -1,
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
