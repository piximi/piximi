import { useEffect, useMemo, useState } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import {
  selectAllExtendedKinds,
  selectExtendedAnnotationsByImageId,
  selectExtendedImageById,
} from "store/dataV2/selectors";
import {
  selectActiveImageId,
  selectFilterLayer,
  selectPlaneScope,
  selectSelectionLayer,
} from "@ImageViewer/state/image-viewer-data/selectors";
import {
  selectRelativeFeatureBounds,
  selectSelectedAnnotations,
  selectVisibleAnnotations,
} from "@ImageViewer/state/image-viewer-data/reselectors";
import { useParameterizedSelector } from "store/hooks";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";
import {
  activeFeatureList,
  expandSelection,
  layerFeaturesToState,
  splitSelection,
} from "@ImageViewer/state/image-viewer-data/utils";

import type { ScopeId, KindNode } from "./types";
import type {
  CategoryNode,
  LayerMode,
  PlaneScope,
} from "@ImageViewer/state/types";

/**
 * All of the annotation-drawer's state, derived view-model, and action
 * handlers, factored out of AnnotationSection so the desktop drawer and the
 * mobile Categories/Export panels share one implementation instead of two.
 */
export const useAnnotationSelection = () => {
  const dispatch = useDispatch();
  const kinds = useSelector(selectAllExtendedKinds);
  const activeImageId = useSelector(selectActiveImageId);
  const activeImage = useParameterizedSelector(
    selectExtendedImageById,
    activeImageId ?? "",
  );
  const currentPlane = activeImage?.activePlaneIdx ?? 0;
  const totalPlanes = activeImage?.shape.planes ?? 1;
  const annotations = useParameterizedSelector(
    selectExtendedAnnotationsByImageId,
    activeImageId ?? "",
  );

  const filterLayer = useSelector(selectFilterLayer);
  const { catIds: selCats, features: feats } =
    useSelector(selectSelectionLayer);

  const relativeFeatures = useSelector(selectRelativeFeatureBounds);

  useEffect(() => {
    dispatch(imageViewerDataSlice.actions.clearSelectionLayer());
  }, [activeImageId, dispatch]);

  const planeScope = useSelector(selectPlaneScope);
  const setPlaneScope = (scope: PlaneScope) => {
    dispatch(imageViewerDataSlice.actions.setPlaneScope(scope));
  };

  const [mode, setMode] = useState<LayerMode>("hide");

  // ---- derived ----
  const view = useSelector(selectVisibleAnnotations);
  const selectedAnnotations = useSelector(selectSelectedAnnotations);

  const groups = useMemo(() => {
    let hidden = 0;
    const list = kinds.map((k): KindNode => {
      const inView = view.filter((a) => a.kindId === k.id);
      if (inView.length === 0 && k.cats.length > 0) hidden++;
      const catsSet = new Set(selCats);
      const cats: CategoryNode[] = k.cats.map((c) => ({
        ...c,
        sel: catsSet.has(c.id),
        count: inView.filter((a) => a.categoryId === c.id).length,
      }));
      const selN = k.cats.filter((c) => catsSet.has(c.id)).length;
      return {
        ...k,
        cats,
        count: inView.length,
        allSel: k.cats.length > 0 && selN === k.cats.length,
        someSel: selN > 0 && selN < k.cats.length,
      };
    });
    return { list, hidden };
  }, [kinds, view, selCats]);

  // Current selection criterion (categories + active feature ranges).
  const activeFeats = useMemo(() => activeFeatureList(feats), [feats]);

  const anySel = selCats.length > 0 || activeFeats.length > 0;
  const selectedIds = useMemo(
    () => selectedAnnotations.map((a) => a.id),
    [selectedAnnotations],
  );

  const planeCount = annotations.filter(
    (a) => a.planeIdx === currentPlane,
  ).length;

  const selSummary = (() => {
    if (!anySel) return "Nothing selected";
    const p = [];
    if (selCats.length)
      p.push(
        `${selCats.length} ${selCats.length === 1 ? "category" : "categories"}`,
      );
    if (activeFeats.length)
      p.push(
        `${activeFeats.length} ${activeFeats.length === 1 ? "feature" : "features"}`,
      );
    return p.join(" · ");
  })();

  const selectAll = () => {
    const ids = kinds.flatMap((k) =>
      k.cats
        .filter((c) => view.some((a) => a.categoryId === c.id))
        .map((c) => c.id),
    );
    dispatch(
      imageViewerDataSlice.actions.toggleCatSelection({
        ids,
        on: true,
      }),
    );
  };

  // ---- feature filters ----

  const clearSel = () => {
    dispatch(imageViewerDataSlice.actions.clearSelectionLayer());
  };
  // ---- create or update the single filter layer from the selection ----
  const handleApplyFilter = () => {
    if (!anySel) return;
    const { kindIds, catIds } = splitSelection(selCats, kinds);
    const layer = {
      enabled: true,
      mode,
      catIds,
      kindIds,
      features: activeFeats,
    };
    batch(() => {
      dispatch(imageViewerDataSlice.actions.setFilterLayer(layer));
      dispatch(imageViewerDataSlice.actions.clearSelectionLayer());
    });
  };

  // ---- load the existing layer's criteria back onto the selection surface ----
  const handleEditLayer = () => {
    if (!filterLayer) return;
    dispatch(
      imageViewerDataSlice.actions.setSelectionLayer({
        catIds: expandSelection(filterLayer, kinds),
        features: layerFeaturesToState(filterLayer.features),
      }),
    );
    setMode(filterLayer.mode);
  };

  const handleToggleFilter = () => {
    dispatch(imageViewerDataSlice.actions.toggleFilterLayer());
  };

  const handleDeleteFilter = () => {
    dispatch(imageViewerDataSlice.actions.deleteFilterLayer());
  };

  // ---- delete / export ----
  const idsForScope = (kind: ScopeId): Set<string> => {
    if (kind === "selected") return new Set(selectedIds);
    if (kind === "view") return new Set(view.map((a) => a.id));
    if (kind === "plane")
      return new Set(
        annotations.filter((a) => a.planeIdx === currentPlane).map((a) => a.id),
      );
    return new Set(annotations.map((a) => a.id));
  };

  return {
    kinds,
    currentPlane,
    totalPlanes,
    annotations,
    filterLayer,
    feats,
    relativeFeatures,
    planeScope,
    setPlaneScope,
    mode,
    setMode,
    view,
    groups,
    anySel,
    selectedIds,
    planeCount,
    selSummary,
    selectAll,
    clearSel,
    handleApplyFilter,
    handleEditLayer,
    handleToggleFilter,
    handleDeleteFilter,
    idsForScope,
  };
};
