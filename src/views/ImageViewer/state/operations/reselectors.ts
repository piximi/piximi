import { createSelector } from "@reduxjs/toolkit";

import { selectAnnotationEntities } from "store/data/selectors";

import { decodeRleArray } from "utils/image";

import { masksOverlap } from "views/ImageViewer/core/mask-operations/maskOps";
import {
  asRegion,
  computePendingOperation,
  FOLD_OP,
} from "views/ImageViewer/core/mask-operations/pendingOperation";

import {
  selectAnnotationMode,
  selectPendingTargetIds,
} from "../annotator/selectors";
import { selectFullWorkingAnnotation } from "../annotator/reselectors";
import { selectSelectionLayer } from "../imageViewerData/selectors";
import { selectVisibleAnnotations } from "../imageViewerData/reselectors";

import type { BBox, ExtendedAnnotationObject } from "core/entities";

import type { PendingOperation } from "views/ImageViewer/core/mask-operations/pendingOperation";

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
export const selectResolvedTargetIds = createSelector(
  selectOverlapCandidateIds,
  selectPendingTargetIds,
  (candidates, picked): Array<string> => {
    if (candidates.length === 1) return candidates;
    const candidatesSet = new Set(candidates);
    return picked.filter((id) => candidatesSet.has(id));
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
          Uint8Array.from(decodeRleArray(ann.encodedMask)),
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

export const selectPendingOperation = createSelector(
  selectAnnotationMode,
  selectVisibleAnnotations,
  selectFullWorkingAnnotation,
  selectResolvedTargetIds,
  selectSelectionOperandIds,
  (
    mode,
    annotations,
    stroke,
    targetIds,
    operandIds,
  ): PendingOperation | null => {
    return computePendingOperation(
      mode,
      annotations,
      stroke,
      targetIds,
      operandIds,
    );
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
