import { useMemo } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import { UNKNOWN_KIND_ID } from "core/entities";

import {
  selectAllExtendedKinds,
  selectExtendedImageById,
} from "store/data/selectors";
import { useParameterizedSelector } from "store/hooks";

import {
  selectActiveImageId,
  selectFilterLayer,
  selectPlaneScope,
  selectSelectionLayer,
} from "@ImageViewer/state/imageViewerData/selectors";
import {
  selectActiveImageAnnotations,
  selectGlobalFeatureBounds,
  selectSelectedAnnotations,
  selectVisibleAnnotations,
} from "@ImageViewer/state/imageViewerData/reselectors";
import { imageViewerDataSlice } from "@ImageViewer/state/imageViewerData";
import {
  activeFeatureList,
  matchesLayer,
  mergeFeatureRanges,
  splitSelection,
} from "@ImageViewer/state/imageViewerData/utils";

import { useCriterionToggles } from "./useCriterionToggles";

import type {
  CategoryNode,
  LayerMode,
  PlaneScope,
} from "@ImageViewer/state/types";

import type { ScopeId, KindNode } from "./types";

/**
 * All of the annotation-drawer's state, derived view-model, and action
 * handlers, factored out of AnnotationSection so the desktop drawer and the
 * mobile Categories/Export panels share one implementation instead of two.
 */
export const useAnnotationSelection = () => {
  const dispatch = useDispatch();
  const { toggleCategories } = useCriterionToggles();
  const kinds = useSelector(selectAllExtendedKinds);
  const activeImageId = useSelector(selectActiveImageId);
  const activeImage = useParameterizedSelector(
    selectExtendedImageById,
    activeImageId ?? "",
  );
  const currentPlane = activeImage?.activePlaneIdx ?? 0;
  const totalPlanes = activeImage?.shape.planes ?? 1;
  const annotations = useSelector(selectActiveImageAnnotations);
  const featureParams = useSelector(selectGlobalFeatureBounds);

  const filterLayer = useSelector(selectFilterLayer);
  const {
    catIds: selCats,
    features: feats,
    includeIds,
    excludeIds,
  } = useSelector(selectSelectionLayer);

  const planeScope = useSelector(selectPlaneScope);
  const setPlaneScope = (scope: PlaneScope) => {
    dispatch(imageViewerDataSlice.actions.setPlaneScope(scope));
  };

  // ---- derived ----
  const view = useSelector(selectVisibleAnnotations);
  const selectedAnnotations = useSelector(selectSelectedAnnotations);

  const groups = useMemo(() => {
    let hidden = 0;
    const list: KindNode[] = [];
    kinds.forEach((k) => {
      const inView = view.filter((a) => a.kindId === k.id);
      const total = annotations.filter((a) => a.kindId === k.id).length;
      if (k.id === UNKNOWN_KIND_ID && total === 0) return;
      if (inView.length === 0 && k.cats.length > 0) hidden++;
      const catsSet = new Set(selCats);
      const cats: CategoryNode[] = k.cats.map((c) => ({
        ...c,
        sel: catsSet.has(c.id),
        count: inView.filter((a) => a.categoryId === c.id).length,
        total: annotations.filter((a) => a.categoryId === c.id).length,
      }));
      const selN = k.cats.filter((c) => catsSet.has(c.id)).length;
      list.push({
        ...k,
        cats,
        count: inView.length,
        total,
        allSel: k.cats.length > 0 && selN === k.cats.length,
        someSel: selN > 0 && selN < k.cats.length,
      });
    });
    return { list, hidden };
  }, [kinds, view, selCats]);

  // Current selection criterion (categories + active feature ranges).
  const activeFeats = useMemo(
    () => activeFeatureList(feats, featureParams),
    [feats, featureParams],
  );

  const selectedIds = useMemo(
    () => selectedAnnotations.map((a) => a.id),
    [selectedAnnotations],
  );

  // Counts the derived set rather than the categories and features alone: a
  // click-only selection has neither. Manual picks are global and outlive the
  // image they were made on, so counting includeIds directly would light up the
  // footer and the Apply-filter button on an image where nothing is selected.
  const anySel =
    selCats.length > 0 || activeFeats.length > 0 || selectedIds.length > 0;

  // Manual deltas worth surfacing: an include only counts if the criterion
  // wouldn't have caught it anyway, an exclude only if the criterion would have.
  // That skips inert exclusions left behind by a term that's since been removed.
  const { added, removed } = useMemo(() => {
    if (!includeIds.length && !excludeIds.length)
      return { added: 0, removed: 0 };
    const { kindIds, catIds } = splitSelection(selCats, kinds);
    const bare = { catIds, kindIds, features: activeFeats };
    const inc = new Set(includeIds);
    const exc = new Set(excludeIds);
    let added = 0;
    let removed = 0;
    view.forEach((a) => {
      const bareMatch = matchesLayer(a, bare);
      if (inc.has(a.id) && !bareMatch) added++;
      else if (exc.has(a.id) && bareMatch) removed++;
    });
    return { added, removed };
  }, [includeIds, excludeIds, selCats, kinds, activeFeats, view]);

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
    // A hand-tweaked selection survives slider drags now, so a checked category
    // showing fewer than its full count needs a visible reason.
    if (added) p.push(`+${added}`);
    if (removed) p.push(`−${removed}`);
    if (!p.length) return `${selectedIds.length} picked`;
    return p.join(" · ");
  })();

  const selectAll = () => {
    const ids = kinds.flatMap((k) =>
      k.cats
        .filter((c) => view.some((a) => a.categoryId === c.id))
        .map((c) => c.id),
    );
    toggleCategories(ids, true);
  };

  // ---- feature filters ----

  const clearSel = () => {
    dispatch(imageViewerDataSlice.actions.clearSelectionLayer());
  };
  // ---- create the filter, or merge the selection into the existing one ----
  const handleApplyFilter = () => {
    if (!anySel) return;
    const { kindIds: newKindIds, catIds: newCatIds } = splitSelection(
      selCats,
      kinds,
    );
    // Manual picks are global, but a filter built here describes what the user
    // is looking at — `view` is the plane-scoped, already-filtered set, so ids
    // picked on another image stay out of the layer.
    const viewIds = new Set(view.map((a) => a.id));
    const inView = (ids: string[]) => ids.filter((id) => viewIds.has(id));
    const layer = filterLayer
      ? {
          enabled: true,
          // An update never rewrites the layer's mode — that is edited on the
          // layer's own row.
          mode: filterLayer.mode,
          catIds: [...new Set([...filterLayer.catIds, ...newCatIds])],
          kindIds: [...new Set([...filterLayer.kindIds, ...newKindIds])],
          features: mergeFeatureRanges(filterLayer.features, activeFeats),
          // Manual picks carry into the layer so what was highlighted is what
          // gets filtered. On a hide layer the predicate is negated, so an
          // include hides exactly that annotation and an exclude exempts it.
          includeIds: [
            ...new Set([...filterLayer.includeIds, ...inView(includeIds)]),
          ],
          excludeIds: [
            ...new Set([...filterLayer.excludeIds, ...inView(excludeIds)]),
          ],
        }
      : {
          enabled: true,
          // A layer is born keeping its matches; flip it on the row after.
          mode: "keep" as LayerMode,
          catIds: newCatIds,
          kindIds: newKindIds,
          features: activeFeats,
          includeIds: inView(includeIds),
          excludeIds: inView(excludeIds),
        };
    batch(() => {
      dispatch(imageViewerDataSlice.actions.setFilterLayer(layer));
      dispatch(imageViewerDataSlice.actions.clearSelectionLayer());
    });
  };

  const handleSetFilterMode = (mode: LayerMode) => {
    dispatch(imageViewerDataSlice.actions.setFilterLayerMode(mode));
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
    planeScope,
    setPlaneScope,
    view,
    groups,
    anySel,
    selectedIds,
    planeCount,
    selSummary,
    selectAll,
    clearSel,
    handleSetFilterMode,
    handleApplyFilter,
    handleToggleFilter,
    handleDeleteFilter,
    idsForScope,
  };
};
