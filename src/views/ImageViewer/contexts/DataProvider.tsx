import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { batch, useDispatch, useStore } from "react-redux";
import { useLocation } from "react-router-dom";

import { addListener, isAnyOf } from "@reduxjs/toolkit";

import { useBackend } from "core/backend";
import { mirrorImageAnnotations } from "core/backend/sync/mirrorImageAnnotations";

import { dataSlice } from "store/data";
import { selectAnnotationsByImageId } from "store/data/selectors";

import { logger } from "utils/logUtils";

import { imageViewerDataSlice } from "@ImageViewer/state/imageViewerData";
import { annotatorSlice } from "@ImageViewer/state/annotator";
import { ToolType } from "@ImageViewer/utils/enums";

import type { ReactNode } from "react";

import type { UnsubscribeListener } from "@reduxjs/toolkit";

import type { AnnotationSnapshot } from "core/backend/annotations/changeSet";

import type { RootState } from "store/rootReducer";

/*
 * A viewing session edits the annotation tables of its images in the
 * store and hands the difference to the backend when it saves. The
 * snapshot is the base of that difference; for a project whose
 * annotations are not mirrored (a remote one) the session borrows them
 * into the store first and evicts them when it ends.
 */
type AnnotationSession = {
  imageIds: string[];
  /* The tables as the session found them; undefined until loaded. */
  snapshot: AnnotationSnapshot | undefined;
  loading: boolean;
  /* The annotations were brought in for this session and go back out
   * with it, rather than being the store's own. */
  borrowed: boolean;
};

const DataContext = createContext<AnnotationSession>({
  imageIds: [],
  snapshot: undefined,
  loading: true,
  borrowed: false,
});

/* The store actions that are the session's own edits; the rest of the
 * data slice (taxonomy, display settings, partitions written by the
 * backend) does not make the session dirty. */
const editActions = [
  dataSlice.actions.addAnnotation,
  dataSlice.actions.batchAddAnnotation,
  dataSlice.actions.addAnnotationVolume,
  dataSlice.actions.batchAddAnnotationVolume,
  dataSlice.actions.updateAnnotationMask,
  dataSlice.actions.deleteAnnotation,
  dataSlice.actions.batchDeleteAnnotation,
  dataSlice.actions.deleteAnnotationVolume,
  dataSlice.actions.batchDeleteAnnotationVolume,
  dataSlice.actions.bubbleUpdateAnnotationCategory,
  dataSlice.actions.batchBubbleUpdateAnnotationCategory,
  dataSlice.actions.updateAnnotationVolumeCategory,
  dataSlice.actions.batchUpdateAnnotationVolumeCategory,
  dataSlice.actions.updateAnnotationVolumeKind,
  dataSlice.actions.batchUpdateAnnotationVolumeKind,
];

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const backend = useBackend();
  const routerLocation = useLocation();
  const borrowed = backend.kind === "remote";
  // What the router asked for identifies the session; until its load
  // finishes the session is the loading one derived from it.
  const routerKey: unknown = routerLocation.state;
  const [loaded, setLoaded] = useState<
    (AnnotationSession & { key: unknown }) | null
  >(null);
  // Loading the session's annotations dispatches the same actions as
  // editing them; only edits after the snapshot count as unsaved.
  const loadedRef = useRef(false);

  // What the backend itself rewrites on the session's volumes meanwhile (a
  // category or kind deleted elsewhere moves them to unknown) reaches the
  // store through `applyVolumeUpdates`; the snapshot follows, so the save
  // neither sends those moves back nor trips over their newer revisions.
  useEffect(() => {
    const unsubscribe = dispatch(
      addListener({
        actionCreator: dataSlice.actions.applyVolumeUpdates,
        effect: (action) => {
          if (!loadedRef.current) return;
          setLoaded((current) => {
            if (!current?.snapshot) return current;
            const { annotationVolumes } = current.snapshot;
            const entities = { ...annotationVolumes.entities };
            let touched = false;
            for (const update of action.payload) {
              const volume = entities[update.id];
              if (!volume) continue;
              touched = true;
              entities[update.id] = {
                ...volume,
                kindId: update.kindId,
                categoryId: update.categoryId,
                predictionConfidence: update.predictionConfidence,
                predictedAtRunId: update.predictedAtRunId,
                predictionCorrected: update.predictionCorrected,
                ...(update.rev !== undefined && { rev: update.rev }),
              };
            }
            if (!touched) return current;
            return {
              ...current,
              snapshot: {
                ...current.snapshot,
                annotationVolumes: { ...annotationVolumes, entities },
              },
            };
          });
        },
      }),
    );
    return unsubscribe as unknown as UnsubscribeListener;
  }, [dispatch]);

  useEffect(() => {
    const unsubscribe = dispatch(
      addListener({
        matcher: isAnyOf(...editActions),
        effect: (_action, listenerAPI) => {
          if (!loadedRef.current) return;
          const hasUnsavedChanges = (listenerAPI.getState() as RootState)
            .imageViewerData.hasUnsavedChanges;
          if (hasUnsavedChanges) return;
          listenerAPI.dispatch(
            imageViewerDataSlice.actions.setHasUnsavedChanges(true),
          );
        },
      }),
    );
    return unsubscribe as unknown as UnsubscribeListener;
  }, [dispatch]);

  useEffect(() => {
    const initialImageIds: string[] =
      routerLocation.state?.selectedItems?.imageIds ?? [];
    const initialAnnotationIds: string[] =
      routerLocation.state?.selectedItems?.annotationIds ?? [];
    let cancelled = false;
    loadedRef.current = false;
    dispatch(
      imageViewerDataSlice.actions.setImageIsLoading({ isLoading: true }),
    );

    (async () => {
      if (borrowed) {
        try {
          await mirrorImageAnnotations(backend, store, initialImageIds);
        } catch (error) {
          logger(
            ["[ImageViewer] loading the session's annotations failed", error],
            {
              level: "error",
            },
          );
        }
      }
      if (cancelled) return;
      const state = store.getState();
      let activeImageId = initialImageIds[0];
      const firstSelected = initialAnnotationIds[0];
      const annotation = firstSelected
        ? state.data.annotations.entities[firstSelected]
        : undefined;
      // should always be true, but a guard in case it isnt
      if (annotation && initialImageIds.includes(annotation.imageId))
        activeImageId = annotation.imageId;
      const isAnnotated =
        !!activeImageId &&
        selectAnnotationsByImageId(state, activeImageId).length > 0;

      batch(() => {
        dispatch(imageViewerDataSlice.actions.setImageStack(initialImageIds));
        dispatch(imageViewerDataSlice.actions.setActiveImageId(activeImageId));
        // If the images have annotations, set the annotation tool to pointer
        if (isAnnotated)
          dispatch(annotatorSlice.actions.setToolType(ToolType.Pointer));
        // Annotations hand-picked in the ProjectViewer match no category or
        // feature criterion, so they seed the sticky include set.
        if (initialAnnotationIds.length) {
          dispatch(
            imageViewerDataSlice.actions.toggleAnnotationSelection({
              ids: initialAnnotationIds,
              on: true,
            }),
          );
        }
        dispatch(
          imageViewerDataSlice.actions.setImageIsLoading({ isLoading: false }),
        );
      });
      const { annotations, annotationVolumes } = store.getState().data;
      loadedRef.current = true;
      setLoaded({
        key: routerLocation.state,
        imageIds: initialImageIds,
        snapshot: { annotations, annotationVolumes },
        loading: false,
        borrowed,
      });
    })();
    return () => {
      cancelled = true;
      // What the session borrowed goes back out with it, whichever way it
      // ends: a save or discard through the exit dialog, the plain return
      // when nothing changed, the browser's back button. Left behind, the
      // copies would outlive deletions made elsewhere (those are never
      // mirrored) and surface again next to the next session's load.
      if (borrowed) {
        dispatch(dataSlice.actions.evictImageAnnotations(initialImageIds));
      }
    };
  }, [routerLocation.state, dispatch, store, backend, borrowed]);

  const value = useMemo<AnnotationSession>(
    () =>
      loaded && loaded.key === routerKey
        ? loaded
        : {
            imageIds: routerLocation.state?.selectedItems?.imageIds ?? [],
            snapshot: undefined,
            loading: true,
            borrowed,
          },
    [loaded, routerKey, routerLocation.state, borrowed],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useAnnotationSession = (): AnnotationSession =>
  useContext(DataContext);
