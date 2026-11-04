import type { BBox, DataArray } from "core/entities";

import type { Point } from "utils/types";

import type {
  CenterOfMass,
  NearestNeighborResult,
  OverlapResult,
  TrackInput,
} from "./types";

export const groupByKind = (inputs: TrackInput[], kind: string) => {
  const groupedByKind: Record<string, Record<string, TrackInput>> = {};
  inputs.forEach((input) => {
    if (kind !== "All" && input.kindId !== kind) return;
    groupedByKind[input.kindId] ??= {};
    groupedByKind[input.kindId][input.id] = input;
  });
  return groupedByKind;
};

export const createOrderedTrackInputs = (
  inputs: Record<string, TrackInput>,
  numFrames: number,
) => {
  const ordered: Array<Record<string, TrackInput>> = Array.from(
    { length: numFrames },
    () => ({}),
  );
  const warnings: string[] = [];
  Object.values(inputs).forEach((input) => {
    if (!ordered[input.timepoint]) {
      warnings.push(
        `Skipped annotation ${input.id}: timepoint ${input.timepoint} exceeds number of frames ${numFrames}`,
      );
      return;
    }
    ordered[input.timepoint][input.id] = input;
  });
  return { ordered, warnings };
};

export function calculateCenterOfMass(
  decodedMask: DataArray | Uint8ClampedArray,
  width: number,
): Point & { mass: number } {
  let mass = 0;
  let xSum = 0;
  let ySum = 0;

  for (let i = 0; i < decodedMask.length; i++) {
    if (decodedMask[i] !== 0) {
      xSum += i % width;
      ySum += Math.floor(i / width);
      mass++;
    }
  }

  if (mass === 0) return { x: 0, y: 0, mass };

  return { x: xSum / mass, y: ySum / mass, mass };
}

export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function findNearestNeighbors(
  sourceCenter: CenterOfMass,
  targetCenters: CenterOfMass[],
  maxDistance?: number,
): NearestNeighborResult | undefined {
  const inRange = targetCenters
    .map((target) => ({
      id: target.annotationId,
      distance: calculateDistance(target, sourceCenter),
    }))
    .filter(
      ({ distance }) => maxDistance === undefined || distance <= maxDistance,
    )
    .sort((a, b) => a.distance - b.distance);

  if (inRange.length === 0) return undefined;

  return {
    sourceId: sourceCenter.annotationId,
    targetId: inRange.map(({ id }) => id),
    distance: inRange[0].distance,
  };
}

export function groupByTimepoint<T extends { timepoint?: number }>(
  annotations: T[],
): Map<number, T[]> {
  const grouped = new Map<number, T[]>();

  for (const ann of annotations) {
    if (ann.timepoint === undefined) continue;
    const existing = grouped.get(ann.timepoint) || [];
    existing.push(ann);
    grouped.set(ann.timepoint, existing);
  }

  return grouped;
}

export function findOverlappingBoxes(
  targetBox: BBox,
  anns: Array<Pick<TrackInput, "id" | "boundingBox">>,
): OverlapResult[] {
  const [x1, y1, x2, y2] = targetBox;
  const targetArea = (x2 - x1) * (y2 - y1);

  return anns
    .map(({ id, boundingBox: [bx1, by1, bx2, by2] }) => {
      const overlapX1 = Math.max(x1, bx1);
      const overlapY1 = Math.max(y1, by1);
      const overlapX2 = Math.min(x2, bx2);
      const overlapY2 = Math.min(y2, by2);

      if (overlapX1 < overlapX2 && overlapY1 < overlapY2) {
        const overlapArea = (overlapX2 - overlapX1) * (overlapY2 - overlapY1);
        return { id, overlap: overlapArea / targetArea };
      }

      return null;
    })
    .filter((result): result is OverlapResult => result !== null);
}
