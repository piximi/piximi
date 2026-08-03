import { useDispatch, useSelector } from "react-redux";

import { selectExtendedAnnotationsByImageId } from "store/dataV2/selectors";
import { useParameterizedSelector } from "store/hooks";
import {
  selectActiveImageId,
  selectSelectionLayer,
} from "@ImageViewer/state/image-viewer-data/selectors";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";
import {
  idsInCategories,
  idsInFeatureRange,
} from "@ImageViewer/state/image-viewer-data/utils";
import type { FeatureKey } from "store/dataV2/types";

/**
 * The criterion half of the selection surface — category checkboxes and feature
 * ranges — with the exclusion-clearing rule applied in one place.
 *
 * Adding a term drops manual deselections among *that term's own* matches and
 * nothing else, so checking a second category never resurrects an annotation
 * excluded from the first. Removing a term drops nothing, and neither does
 * dragging the bounds of an already-active range.
 *
 * Lives here rather than in each component because CategoryTree, FeatureFilters
 * and useAnnotationSelection all drive these reducers, and the invariant should
 * not be forgettable at any one of them.
 */
export const useCriterionToggles = () => {
  const dispatch = useDispatch();
  const activeImageId = useSelector(selectActiveImageId);
  const annotations = useParameterizedSelector(
    selectExtendedAnnotationsByImageId,
    activeImageId ?? "",
  );
  const { features: feats } = useSelector(selectSelectionLayer);

  const toggleCategories = (ids: string[], on: boolean) => {
    dispatch(
      imageViewerDataSlice.actions.toggleCatSelection({
        ids,
        on,
        admits: on ? idsInCategories(annotations, ids) : undefined,
      }),
    );
  };

  const toggleFeature = (key: FeatureKey, bounds: [number, number]) => {
    const becomingActive = !feats[key].active;
    dispatch(
      imageViewerDataSlice.actions.toggleFeatureSelection({
        key,
        bounds,
        admits: becomingActive
          ? idsInFeatureRange(annotations, key, bounds)
          : undefined,
      }),
    );
  };

  const setFeatureRange = (key: FeatureKey, range: [number, number]) => {
    dispatch(
      imageViewerDataSlice.actions.updateFeatureSelection({ key, range }),
    );
  };

  return { toggleCategories, toggleFeature, setFeatureRange };
};
