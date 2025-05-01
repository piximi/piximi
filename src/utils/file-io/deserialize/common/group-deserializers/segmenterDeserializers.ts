import { Group } from "zarr";
import { initialState as initialSegmenterState } from "store/segmenter/segmenterSlice";
import { getAttr } from "../../../zarr/zarrUtils";

export const deserializeSegmenterGroup = async (segmenterGroup: Group) => {
  // present, but not used currently
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const modelName = await getAttr(segmenterGroup, "name");

  // TODO - decode segmenter once encoding scheme developed
  return initialSegmenterState;
};
