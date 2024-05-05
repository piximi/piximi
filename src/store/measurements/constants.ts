import { SelectionTreeItems } from "./types";

export const baseMeasurementOptions: SelectionTreeItems = {
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
    state: "off",
  },
  "intensity-total": {
    id: "intensity-total",
    name: "Total",
    parent: "intensity",
    state: "off",
  },
  "intensity-mean": {
    id: "intensity-mean",
    name: "Mean",
    parent: "intensity",
    state: "off",
  },
  "intensity-std": {
    id: "intensity-std",
    name: "Standard Deviation",
    parent: "intensity",
    state: "off",
  },
  "intensity-MAD": {
    id: "intensity-MAD",
    name: "MAD",
    parent: "intensity",
    state: "off",
  },
  "intensity-min": {
    id: "intensity-min",
    name: "Minimum",
    parent: "intensity",
    state: "off",
  },
  "intensity-max": {
    id: "intensity-max",
    name: "Maximum",
    parent: "intensity",
    state: "off",
  },
  "intensity-lower-quartile": {
    id: "intensity-lower-quartile",
    name: "Lower Quartile",
    parent: "intensity",
    state: "off",
  },
  "intensity-upper-quartile": {
    id: "intensity-upper-quartile",
    name: "Upper Quartile",
    parent: "intensity",
    state: "off",
  },
};
