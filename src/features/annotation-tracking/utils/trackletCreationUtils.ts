import { DecodedAnnotationObject } from "store/data/types";
import type {
  AnnotationInfo,
  CenterOfMass,
  NearestNeighborResult,
  OverlapResult,
} from "./types";

export const createOrderedAnnotationRecord = (
  annotations: Record<string, DecodedAnnotationObject>,
  timepoints: number,
) => {
  const orderedAnnRecord: Array<Record<string, DecodedAnnotationObject>> = [];
  while (timepoints > 0) {
    orderedAnnRecord.push({});
    timepoints--;
  }
  Object.values(annotations).forEach((ann) => {
    if (!orderedAnnRecord[ann.timepoint]) {
      console.error(
        `could not process annotation with id ${ann.id}: annotation timepoint ${annotations.timpoint} exceeds number of frames ${timepoints}`,
      );
      return;
    }
    orderedAnnRecord[ann.timepoint][ann.id] = ann;
  });
  return orderedAnnRecord;
};
/**
 * Calculate center of mass for a bounding box
 */
export function calculateCenterOfMass(
  decodedMask: DecodedAnnotationObject["decodedMask"],
  width: number,
): { x: number; y: number } {
  let totalMass = 0;
  let xSum = 0;
  let ySum = 0;

  for (let i = 0; i < decodedMask.length; i++) {
    if (decodedMask[i] !== 0) {
      const x = i % width;
      const y = Math.floor(i / width);
      xSum += x;
      ySum += y;
      totalMass++;
    }
  }

  if (totalMass === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: xSum / totalMass,
    y: ySum / totalMass,
  };
}

/**
 * Calculate Euclidean distance between two points
 */
export function calculateDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function findNearestNeighbors(
  sourceCenter: CenterOfMass,
  targetCenters: CenterOfMass[],
  maxDistance?: number,
): NearestNeighborResult | undefined {
  const nearestTarget: CenterOfMass[] = [];
  let minDistance = Infinity;
  targetCenters.forEach((target) => {
    const distance = calculateDistance(target, sourceCenter);
    if (distance < 50) {
      minDistance = distance;
      nearestTarget.push(target);
    }
  });

  if (
    nearestTarget.length !== 0 &&
    (maxDistance === undefined || minDistance <= maxDistance)
  ) {
    return {
      sourceId: sourceCenter.annotationId,
      targetId: nearestTarget.map((target) => target.annotationId),
      distance: minDistance,
    } as NearestNeighborResult;
  }
}

/**
 * Calculate Intersection over Union (IOU) for two bounding boxes
 */
export function calculateIOU(
  box1: [number, number, number, number],
  box2: [number, number, number, number],
): number {
  const xMin1 = box1[0];
  const yMin1 = box1[1];
  const xMax1 = box1[2];
  const yMax1 = box1[3];

  const xMin2 = box2[0];
  const yMin2 = box2[1];
  const xMax2 = box2[2];
  const yMax2 = box2[3];
  const xOverlap = Math.max(0, Math.min(xMax1, xMax2) - Math.max(xMin1, xMin2));
  const yOverlap = Math.max(0, Math.min(yMax1, yMax2) - Math.max(yMin1, yMin2));

  const intersectionArea = xOverlap * yOverlap;

  const box1Area = (xMax1 - xMin1) * (yMax1 - yMin1);
  const box2Area = (xMax2 - xMin2) * (yMax2 - yMin2);
  const unionArea = box1Area + box2Area - intersectionArea;

  if (unionArea === 0) return 0;

  return intersectionArea / unionArea;
}

/**
 * Group annotations by timepoint
 */
export function groupByTimepoint(
  annotations: AnnotationInfo[],
): Map<number, AnnotationInfo[]> {
  const grouped = new Map<number, AnnotationInfo[]>();

  for (const ann of annotations) {
    if (!ann.timepoint) continue;
    const existing = grouped.get(ann.timepoint) || [];
    existing.push(ann);
    grouped.set(ann.timepoint, existing);
  }

  return grouped;
}

export function findOverlappingBoxes(
  targetBox: AnnotationInfo["boundingBox"],
  anns: AnnotationInfo[],
): OverlapResult[] {
  const [x1, y1, x2, y2] = targetBox;
  const targetArea = (x2 - x1) * (y2 - y1);

  return anns
    .map((ann) => {
      const [bx1, by1, bx2, by2] = ann.boundingBox;
      // Calculate the intersection rectangle
      const overlapX1 = Math.max(x1, bx1);
      const overlapY1 = Math.max(y1, by1);
      const overlapX2 = Math.min(x2, bx2);
      const overlapY2 = Math.min(y2, by2);

      // Check if there's an overlap
      if (overlapX1 < overlapX2 && overlapY1 < overlapY2) {
        const overlapArea = (overlapX2 - overlapX1) * (overlapY2 - overlapY1);
        const percentOverlap = Math.floor(100 * (overlapArea / targetArea));
        return { ...ann, overlapArea: percentOverlap };
      }

      return null;
    })
    .filter((result): result is OverlapResult => result !== null);
}
