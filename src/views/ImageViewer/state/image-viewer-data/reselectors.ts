import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "store/rootReducer";
import {
  selectAllExtendedAnnotations,
  selectAllExtendedKinds,
  selectExtendedAnnotationsByImageId,
  selectExtendedImageById,
} from "store/dataV2/selectors";
import { OBJECT_FEATURES } from "store/dataV2/types";

import {
  selectActiveImageId,
  selectFilterLayer,
  selectPlaneScope,
  selectSelectionLayer,
} from "./selectors";
import {
  activeFeatureList,
  applyFilterLayer,
  FEATURES,
  matchesLayer,
  splitSelection,
} from "./utils";

import type { FeatureParams } from "./utils";

export const selectActiveViewerImage = (state: RootState) =>
  selectExtendedImageById(state, selectActiveImageId(state) ?? "");

export const selectAllActiveAnnotations = createSelector(
  selectActiveViewerImage,
  selectAllExtendedAnnotations,
  (im, anns) => {
    if (!im) return [];
    return anns.filter(
      (ann) => ann.imageId === im.id && ann.planeId === im.activePlaneId,
    );
  },
);

// All planes for the active image (unlike selectAllActiveAnnotations, which is
// pre-filtered to the single currently-active plane). This is the shared base
// for anything that needs to respect the real plane-scope toggle (#12).
const selectActiveImageAnnotations = (state: RootState) =>
  selectExtendedAnnotationsByImageId(state, selectActiveImageId(state) ?? "");

export const selectRelativeFeatureBounds = createSelector(
  selectActiveImageAnnotations,
  (annotations): FeatureParams => {
    const base = Object.fromEntries(
      Object.entries(FEATURES).map(([k, v]) => [
        k,
        { ...v, bounds: [...v.bounds] },
      ]),
    ) as FeatureParams;
    annotations.forEach((ann) => {
      OBJECT_FEATURES.forEach((f) => {
        const featVal = ann.features?.[f];
        if (featVal === undefined) return;
        if (featVal > base[f].bounds[1]) base[f].bounds[1] = featVal;
        else if (featVal < base[f].bounds[0]) base[f].bounds[0] = featVal;
      });
    });
    return base;
  },
);

// The drawer's filtered view. Consumed by AnnotationSection *and* the 3D
// stage (useThreeAnnotationMeshes) so both agree on plane scope (#12) instead
// of maintaining two independent, diverging pipelines.
export const selectVisibleAnnotations = createSelector(
  selectActiveImageAnnotations,
  selectPlaneScope,
  selectFilterLayer,
  selectActiveViewerImage,
  (anns, planeScope, layer, im) =>
    applyFilterLayer(anns, planeScope, layer, im?.activePlaneIdx ?? 0),
);

/**
 * The selected set: the criterion's matches, plus manually included annotations,
 * minus manually excluded ones. Derived from the *visible* annotations, so ids
 * hidden by the filter layer or out of plane scope drop out on their own rather
 * than dangling.
 *
 * No empty-criterion guard here — `matchesLayer` already returns false for a
 * criterion with no positive term. Guarding on the category/feature counts alone
 * would swallow a click-only selection.
 */
export const selectSelectedAnnotations = createSelector(
  selectVisibleAnnotations,
  selectSelectionLayer,
  selectAllExtendedKinds,
  (anns, sl, kinds) => {
    if (anns.length === 0) return [];
    const { catIds: selCats, features, includeIds, excludeIds } = sl;
    const { kindIds, catIds } = splitSelection(selCats, kinds);
    const criterion = {
      catIds,
      kindIds,
      features: activeFeatureList(features),
      includeIds,
      excludeIds,
    };
    return anns.filter((a) => matchesLayer(a, criterion));
  },
);

export const selectHasSelection = createSelector(
  selectSelectedAnnotations,
  (selected) => selected.length > 0,
);
