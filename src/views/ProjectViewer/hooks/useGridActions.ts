import { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useBackend } from "core/backend";
import { randomKey, useBackendQuery } from "core/backend/query";

import { useHotkeys } from "hooks";

import { applicationSettingsSlice } from "store/applicationSettings";
import { dataSlice } from "store/data";

import { AlertType, HotkeyContext } from "utils/enums";

import { projectSlice } from "@ProjectViewer/state";
import { selectActiveSelectedIds } from "@ProjectViewer/state/selectors";
import { selectActiveCategories } from "@ProjectViewer/state/reselectors";

import { useDataRevision } from "./useCounts";
import { useActiveGridQuery } from "./useGridQuery";

import type { ActiveGridQuery } from "./useGridQuery";

const NONE: string[] = [];

const selectionKey = (ids: string[]) =>
  `${ids.length}:${randomKey(0, ids.join("\n"))}`;

/*
 * Bulk actions over the active grid. Their scope is what the grid shows, so
 * the selection is narrowed through the grid's own query and "all" is
 * fetched from it, rather than read from a list held in memory.
 */
export const useGridActions = () => {
  const dispatch = useDispatch();
  const backend = useBackend();
  const revision = useDataRevision();
  const activeCategories = useSelector(selectActiveCategories);
  const selectedIds = useSelector(selectActiveSelectedIds);
  const active = useActiveGridQuery();

  const total =
    useBackendQuery(
      `count:${active.key}`,
      () =>
        active.view === "images"
          ? backend.query.imageCounts(active.query)
          : backend.query.annotationCounts(active.query),
      revision,
    ).value?.total ?? 0;

  const { value: scoped } = useBackendQuery(
    selectedIds.length === 0
      ? null
      : `selected:${active.key}:${selectionKey(selectedIds)}`,
    () => visibleIds(backend, active, selectedIds),
    revision,
  );
  const selectedFilteredItemIds =
    selectedIds.length === 0 ? NONE : (scoped ?? selectedIds);

  const allSelected = total > 0 && selectedFilteredItemIds.length >= total;
  const hasItems = total > 0;

  // Deleting goes through the backend, which is where the grid reads from;
  // the selection is dropped by hand, since a remote project's objects are
  // not in the store for the stale-selection listener to notice.
  const handleDelete = () => {
    const ids = selectedFilteredItemIds;
    const deletion =
      active.view === "images"
        ? backend.images.delete({ ids }).then(() => {
            dispatch(projectSlice.actions.removeSelectedImages(ids));
          })
        : backend.annotations.delete({ ids }).then(() => {
            dispatch(
              projectSlice.actions.removeSelectedAnnotations({
                kindId: active.kindId,
                ids,
              }),
            );
          });
    deletion.catch((error: unknown) => {
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: {
            alertType: AlertType.Error,
            name: "Could not delete",
            description: error instanceof Error ? error.message : String(error),
          },
        }),
      );
    });
  };

  const handleSelectAll = useCallback(async () => {
    const ids = await visibleIds(backend, active);
    if (active.view === "images") {
      dispatch(projectSlice.actions.addSelectedImages(ids));
    } else {
      dispatch(
        projectSlice.actions.addSelectedAnnotations({
          kindId: active.kindId,
          ids,
        }),
      );
    }
  }, [backend, active, dispatch]);

  const handleDeselectAll = useCallback(() => {
    if (active.view === "images") {
      dispatch(
        projectSlice.actions.removeSelectedImages(selectedFilteredItemIds),
      );
    } else {
      dispatch(
        projectSlice.actions.removeSelectedAnnotations({
          kindId: active.kindId,
          ids: selectedFilteredItemIds,
        }),
      );
    }
  }, [active, dispatch, selectedFilteredItemIds]);

  const handleCategorize = (categoryId: string) => {
    const payload = selectedFilteredItemIds.map((id) => ({ id, categoryId }));
    if (active.view === "images") {
      dispatch(dataSlice.actions.batchUpdateImageCategory(payload));
    } else {
      dispatch(dataSlice.actions.batchBubbleUpdateAnnotationCategory(payload));
    }
  };

  useHotkeys(
    "esc",
    () => {
      selectedFilteredItemIds.length > 0 && handleDeselectAll();
    },
    HotkeyContext.ProjectView,
  );

  useHotkeys(
    "control+a",
    () => !allSelected && void handleSelectAll(),
    HotkeyContext.ProjectView,
  );

  return {
    total,
    selectedFilteredItemIds,
    allSelected,
    hasItems,
    handleDelete,
    activeCategories,
    handleCategorize,
    handleDeselectAll,
    handleSelectAll,
  };
};

/* Ids the active grid shows, optionally only among `ids`. */
const visibleIds = (
  backend: ReturnType<typeof useBackend>,
  active: ActiveGridQuery,
  ids?: string[],
): Promise<string[]> =>
  active.view === "images"
    ? backend.query.imageIds({ ...active.query, ids }, active.sort)
    : backend.query.annotationIds({ ...active.query, ids }, active.sort);
