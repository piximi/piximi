import { TreeData } from "./types";

export const baseMeasurementOptions: TreeData = {
  intensity: {
    id: "intensity",
    name: "Intensity",
    children: [
      "intensity-total",
      "intensity-mean",
      "intensity-std",
      "intensity-MAD",
      "intensity-min",
      "intensity-max",
      "intensity-lower-quartile",
      "intensity-upper-quartile",
    ],
  },
  "intensity-total": {
    id: "intensity-total",
    name: "Total",
    parent: "intensity",
  },
  "intensity-mean": {
    id: "intensity-mean",
    name: "Mean",
    parent: "intensity",
  },
  "intensity-std": {
    id: "intensity-std",
    name: "Standard Deviation",
    parent: "intensity",
  },
  "intensity-MAD": {
    id: "intensity-MAD",
    name: "MAD",
    parent: "intensity",
  },
  "intensity-min": {
    id: "intensity-min",
    name: "Minimum",
    parent: "intensity",
  },
  "intensity-max": {
    id: "intensity-max",
    name: "Maximum",
    parent: "intensity",
  },
  "intensity-lower-quartile": {
    id: "intensity-lower-quartile",
    name: "Lower Quartile",
    parent: "intensity",
  },
  "intensity-upper-quartile": {
    id: "intensity-upper-quartile",
    name: "Upper Quartile",
    parent: "intensity",
  },
};
