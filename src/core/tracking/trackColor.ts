import { getDistinctHex } from "utils/colorUtils";

export const getDefaultTrackColor = () =>
  getDistinctHex({ baseColor: "#FBB904", maxSimilarity: 20 });
