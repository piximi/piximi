import { decodeRleArray } from "utils/image";

import { AnnotationMode } from "views/ImageViewer/utils/enums";

import { foldOperands, type MaskRegion, type SetOperation } from "./maskOps";

import type { BBox, ExtendedAnnotationObject } from "core/entities";

import type { WorkingAnnotation } from "views/ImageViewer/utils/types";

export type PendingOperation = {
  /** Annotation id -> the geometry it takes on if this is confirmed. */
  updates: Record<string, MaskRegion>;
  /** Operands folded into the survivor; deleted on confirm. */
  absorbedIds: string[];
  /** The operation resolved but yielded nothing, so it cannot be confirmed. */
  empty: boolean;
};

export const FOLD_OP: Partial<Record<AnnotationMode, SetOperation>> = {
  [AnnotationMode.Add]: "union",
  [AnnotationMode.Subtract]: "difference",
  [AnnotationMode.Intersect]: "intersection",
};

export const asRegion = <
  A extends { encodedMask: number[]; boundingBox: BBox },
>(
  a: A,
): MaskRegion => ({
  mask: Uint8Array.from(decodeRleArray(a.encodedMask)),
  bbox: a.boundingBox,
});

/**
 * The staged operation: what each annotation would become, and which would be
 * absorbed. Null when no operation is pending or it has not resolved a target.
 *
 * Everything is expressed as per-annotation geometry updates so all three shapes
 * fit one structure — a stroke op updating its target, a fold updating the
 * survivor and absorbing the rest, and Invert transforming each operand
 * independently while absorbing nothing.
 *
 * Masks are decoded here, inside a memoized selector, so the cost is paid once
 * per operation change rather than per frame.
 */
export const computePendingOperation = (
  mode: AnnotationMode,
  annotations: ExtendedAnnotationObject[],
  stroke: WorkingAnnotation | undefined,
  targetIds: string[],
  operandIds: string[],
): PendingOperation | null => {
  if (mode === AnnotationMode.New) return null;
  const byId = new Map(annotations.map((a) => [a.id, a]));

  const op = FOLD_OP[mode];
  if (!op) return null;

  if (stroke?.decodedMask) {
    const targets = targetIds
      .map((id) => byId.get(id))
      .filter((a): a is ExtendedAnnotationObject => !!a);
    if (targets.length === 0) return null;
    const strokeRegion: MaskRegion = {
      mask: Uint8Array.from(stroke.decodedMask),
      bbox: stroke.boundingBox,
    };

    // Add folds every picked target plus the stoke into one survivor --
    // same shape as the no-stroke fold below. Subtract/Intersect apply to each
    // each picked target independently: every annotation keeps its identity,
    // nothing is absorbed.

    if (mode === AnnotationMode.Add) {
      const survivorId = targets[0].id;
      const result = foldOperands(op, [...targets.map(asRegion), strokeRegion]);
      return {
        updates: result ? { [survivorId]: result } : {},
        absorbedIds: targets.slice(1).map((a) => a.id),
        empty: !result,
      };
    }

    // Subtract/Intersect
    const updates: Record<string, MaskRegion> = {};
    targets.forEach((target) => {
      const result = foldOperands(op, [asRegion(target), strokeRegion]);
      if (result) updates[target.id] = result;
    });
    return {
      updates,
      absorbedIds: [],
      empty: Object.keys(updates).length === 0,
    };
  }

  if (operandIds.length < 2) return null;
  const regions = operandIds
    .map((id) => byId.get(id))
    .filter((a): a is ExtendedAnnotationObject => !!a)
    .map(asRegion);
  if (regions.length < 2) return null;

  const survivorId = operandIds[0];
  const result = foldOperands(op, regions);
  return {
    updates: result ? { [survivorId]: result } : {},
    absorbedIds: operandIds.slice(1),
    empty: !result,
  };
};
