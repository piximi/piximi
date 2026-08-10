import { createSelector } from "@reduxjs/toolkit";

import { AnnotationMode } from "views/ImageViewer/utils/enums";
import { decode } from "views/ImageViewer/utils/rle";
import {
  foldOperands,
  invertWithinBBox,
  masksOverlap,
} from "views/ImageViewer/utils/maskOps";
import type {
  AnnotationObject,
  BBox,
  ExtendedAnnotationObject,
} from "store/dataV2/types";
import { selectAnnotationEntities } from "store/dataV2/selectors";

import {
  selectAnnotationMode,
  selectPendingTargetId,
} from "../annotator/selectors";
import { selectFullWorkingAnnotation } from "../annotator/reselectors";
import { selectSelectionLayer } from "../image-viewer-data/selectors";
import { selectVisibleAnnotations } from "../image-viewer-data/reselectors";

import type { MaskRegion, SetOperation } from "views/ImageViewer/utils/maskOps";

const FOLD_OP: Partial<Record<AnnotationMode, SetOperation>> = {
  [AnnotationMode.Add]: "union",
  [AnnotationMode.Subtract]: "difference",
  [AnnotationMode.Intersect]: "intersection",
};

const asRegion = (a: AnnotationObject): MaskRegion => ({
  mask: Uint8Array.from(decode(a.encodedMask)),
  bbox: a.boundingBox,
});

/**
 * The annotations a stroke could operate on: every visible annotation whose mask
 * actually overlaps it. Bounding boxes are only a prefilter inside
 * `masksOverlap`, so a stroke passing through a concave annotation's empty
 * interior is correctly not a candidate.
 */
export const selectOverlapCandidateIds = createSelector(
  selectVisibleAnnotations,
  selectFullWorkingAnnotation,
  (annotations, stroke): string[] => {
    if (!stroke?.decodedMask) return [];
    return annotations
      .filter((a) => {
        const region = asRegion(a);
        return masksOverlap(
          region.mask,
          region.bbox,
          stroke.decodedMask,
          stroke.boundingBox,
        );
      })
      .map((a) => a.id);
  },
);

/**
 * Which annotation a stroke operation applies to. One candidate resolves
 * implicitly; more than one waits for an explicit pick, so an ambiguous stroke
 * can never silently edit the wrong annotation.
 */
export const selectResolvedTargetId = createSelector(
  selectOverlapCandidateIds,
  selectPendingTargetId,
  (candidates, picked): string | undefined => {
    if (picked && candidates.includes(picked)) return picked;
    return candidates.length === 1 ? candidates[0] : undefined;
  },
);

/**
 * The operands of a selection-only operation, in click order.
 *
 * Driven off `includeIds` rather than the full selected set, because only clicks
 * carry an order and the first operand is the one that survives a commit —
 * a destructive choice that must not depend on data ordering. Annotations
 * selected by category or feature range are therefore not operands.
 */
export const selectSelectionOperandIds = createSelector(
  selectSelectionLayer,
  selectVisibleAnnotations,
  (layer, visible): string[] => {
    const present = new Set(visible.map((a) => a.id));
    return layer.includeIds.filter((id) => present.has(id));
  },
);

/**
 * Whether each annotation overlaps the initial selected.
 *
 * In order for the "Subtract" and "Intersect" tool to have a meaningful
 * function, there must be some overlap with the first selected annotation.
 * The decision is that overlap is true only if every annotation selected (excluding 1st)
 * overlaps the 1st.
 */
export const selectSelectionOverlaps = createSelector(
  selectSelectionOperandIds,
  selectAnnotationEntities,
  (ids, anns): boolean => {
    if (ids.length <= 1) return false;
    const primary = anns[ids[0]];
    const region = asRegion(primary);
    return ids
      .map((id) => anns[id])
      .every((ann) =>
        masksOverlap(
          region.mask,
          region.bbox,
          Uint8Array.from(decode(ann.encodedMask)),
          ann.boundingBox,
        ),
      );
  },
);

/**
 * Whether clicks should be resolving an operation's target rather than changing
 * the selection. True only while a stroke overlaps several annotations under a
 * combining operation — the one case the overlap cannot settle on its own.
 *
 * Stays true after a pick so the choice can be cycled or changed.
 */
export const selectIsPickingTarget = createSelector(
  selectAnnotationMode,
  selectFullWorkingAnnotation,
  selectOverlapCandidateIds,
  (mode, stroke, candidates): boolean =>
    !!stroke && !!FOLD_OP[mode] && candidates.length > 1,
);

type PendingOperation = {
  /** Annotation id -> the geometry it takes on if this is confirmed. */
  updates: Record<string, MaskRegion>;
  /** Operands folded into the survivor; deleted on confirm. */
  absorbedIds: string[];
  /** The operation resolved but yielded nothing, so it cannot be confirmed. */
  empty: boolean;
};

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
export const selectPendingOperation = createSelector(
  selectAnnotationMode,
  selectVisibleAnnotations,
  selectFullWorkingAnnotation,
  selectResolvedTargetId,
  selectSelectionOperandIds,
  (
    mode,
    annotations,
    stroke,
    targetId,
    operandIds,
  ): PendingOperation | null => {
    if (mode === AnnotationMode.New) return null;
    const byId = new Map(annotations.map((a) => [a.id, a]));

    // Invert never combines operands, so it has no stroke path and no survivor:
    // each selected annotation is transformed where it sits.
    if (mode === AnnotationMode.Invert) {
      if (stroke || operandIds.length === 0) return null;
      const updates: Record<string, MaskRegion> = {};
      operandIds.forEach((id) => {
        const a = byId.get(id);
        if (!a) return;
        const region = asRegion(a);
        const inverted = invertWithinBBox(region.mask, region.bbox);
        if (inverted) updates[id] = inverted;
      });
      return {
        updates,
        absorbedIds: [],
        empty: Object.keys(updates).length === 0,
      };
    }

    const op = FOLD_OP[mode];
    if (!op) return null;

    if (stroke?.decodedMask) {
      const target = targetId ? byId.get(targetId) : undefined;
      if (!target) return null;
      const region = asRegion(target);
      // The target leads, so Subtract reads as "erase what I drew from this
      // annotation" rather than the reverse.
      const result = foldOperands(op, [
        region,
        { mask: Uint8Array.from(stroke.decodedMask), bbox: stroke.boundingBox },
      ]);
      return {
        updates: result ? { [target.id]: result } : {},
        absorbedIds: [],
        empty: !result,
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
  },
);

/**
 * Where the confirm/cancel chrome attaches for a staged operation: the extent of
 * everything the operation would change, so Invert over several annotations gets
 * one set of buttons rather than one per operand.
 */
export const selectPendingOperationBBox = createSelector(
  selectPendingOperation,
  (pending): BBox | undefined => {
    if (!pending || pending.empty) return undefined;
    const boxes = Object.values(pending.updates).map((u) => u.bbox);
    if (boxes.length === 0) return undefined;
    return boxes.reduce<BBox>(
      (acc, b) => [
        Math.min(acc[0], b[0]),
        Math.min(acc[1], b[1]),
        Math.max(acc[2], b[2]),
        Math.max(acc[3], b[3]),
      ],
      boxes[0],
    );
  },
);

type RenderAnnotation = ExtendedAnnotationObject & {
  /** Set while previewing, so the mesh can colour it distinctly. */
  isPreview?: boolean;
  /** Absorbed into another operand by the staged operation. */
  hidden?: boolean;
};

/**
 * Visible annotations with the staged operation applied, for rendering only.
 *
 * The preview lives here rather than in a separate layer: an updated annotation
 * carries its pending `decodedMask` and bounding box, so it re-textures in the
 * Three.js scene where it already sits and no mask has to cross into the SVG
 * overlay.
 */
export const selectAnnotationsForRender = createSelector(
  selectVisibleAnnotations,
  selectPendingOperation,
  (annotations, pending): RenderAnnotation[] => {
    if (!pending || pending.empty) return annotations;
    const absorbed = new Set(pending.absorbedIds);

    return annotations.map((a) => {
      const update = pending.updates[a.id];
      if (update)
        return {
          ...a,
          boundingBox: update.bbox,
          decodedMask: update.mask,
          isPreview: true,
        };
      if (absorbed.has(a.id)) return { ...a, hidden: true };
      return a;
    });
  },
);
