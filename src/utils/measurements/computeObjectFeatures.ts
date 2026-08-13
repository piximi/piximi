import { decode } from "@ImageViewer/utils";
import { fromMask, getRois, Mask, Roi } from "image-js-latest";
import {
  AnnotationObject,
  FeatureKey,
  OBJECT_FEATURES,
} from "store/data/types";

const featureOps: Record<FeatureKey, (r: Roi) => number> = {
  area: (r) => r.surface,
  perimeter: (r) => r.perimeter,
  radius: (r) => r.ped / 2,
  sphericity: (r) => r.sphericity,
  extent: (r) => r.surface / (r.width * r.height),
  bboxArea: (r) => r.width * r.height,
  eqpc: (r) => r.eqpc,
  ped: (r) => r.ped,
  compactness: (r) => (r.sphericity === 0 ? 1000 : 1 / r.sphericity), // prevent divide by 0, chose 1,000 since a sphericity of less than 0.001 seems unlikely  ¯\_(ツ)_/¯
  comX: (r) => r.centroid.column,
  comY: (r) => r.centroid.row,
};
const getMaskRois = (
  width: number,
  height: number,
  data: Uint8Array,
): { roi?: Roi; error?: string } => {
  try {
    const mask = new Mask(width, height, { data: data });
    const manager = fromMask(mask, { allowCorners: true });
    const rois = getRois(manager, { kind: "white" });
    if (rois.length === 0) {
      return { error: "No Rois found" };
    }
    if (rois.length > 1) {
      const roi = rois.reduce((best, r) =>
        r.surface > best.surface ? r : best,
      );
      return {
        roi,
        error: `Expected 1 ROI, found ${rois.length}: largest ROI used`,
      };
    }
    return { roi: rois[0] };
  } catch (e) {
    return {
      roi: undefined,
      error: e instanceof Error ? e.message : String(e),
    };
  }
};
export const computeObjectFeatures = (
  objects: Pick<
    AnnotationObject,
    "id" | "decodedMask" | "encodedMask" | "boundingBox" | "features"
  >[],
) => {
  const computedFeatures: Record<string, AnnotationObject["features"]> = {};
  for (const obj of objects) {
    const decodedMask = Uint8Array.from(
      obj.decodedMask ?? decode(obj.encodedMask, true),
    );
    const bbox = obj.boundingBox;
    const bboxW = bbox[2] - bbox[0];
    const bboxH = bbox[3] - bbox[1];

    const roiResults = getMaskRois(bboxW, bboxH, decodedMask);
    if (roiResults.error)
      console.warn(
        `Error computing ROI for object (${obj.id}): ${roiResults.error}`,
      );
    if (!roiResults.roi) continue;
    const roi = roiResults.roi;

    for (const feat of OBJECT_FEATURES) {
      let result: number;
      try {
        result = featureOps[feat](roi);
      } catch (e) {
        console.warn(
          `Could not compute ${feat} for object ${obj.id}: ${e instanceof Error ? e.message : String(e)}`,
        );
        continue;
      }
      computedFeatures[obj.id] = {
        ...computedFeatures[obj.id],
        [feat]: Math.round(result * 100) / 100,
      };
    }
  }
  return computedFeatures;
};
