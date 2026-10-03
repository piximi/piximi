import { useDispatch } from "react-redux";

import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/";

import type { ObjectFeature } from "core/entities";

/**
 * The criterion half of the selection surface — category checkboxes and feature
 * ranges.
 *
 * Lives here rather than in each component because CategoryTree, FeatureFilters
 * and useAnnotationSelection all drive these reducers, and the invariant should
 * not be forgettable at any one of them.
 */
export const useCriterionToggles = () => {
  const dispatch = useDispatch();

  const toggleCategories = (ids: string[], on: boolean) => {
    dispatch(
      imageViewerDataSlice.actions.toggleCatSelection({
        ids,
        on,
      }),
    );
  };

  const toggleFeature = (key: ObjectFeature) => {
    dispatch(imageViewerDataSlice.actions.toggleFeatureSelection(key));
  };

  const setFeatureRange = (key: ObjectFeature, range: [number, number]) => {
    dispatch(
      imageViewerDataSlice.actions.updateFeatureSelection({ key, range }),
    );
  };

  return { toggleCategories, toggleFeature, setFeatureRange };
};
