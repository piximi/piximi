import type { Selector } from "reselect";
import type {
  EntityId,
  DeferredEntitySelectors,
  DeferredEntityState,
  Dictionary,
} from "./models";
import { createDraftSafeSelector } from "@reduxjs/toolkit";

export function createDeferredSelectorsFactory<T>() {
  function getSelectors(): DeferredEntitySelectors<T, DeferredEntityState<T>>;
  function getSelectors<V>(
    selectState: (state: V) => DeferredEntityState<T>
  ): DeferredEntitySelectors<T, V>;
  function getSelectors<V>(
    selectState?: (state: V) => DeferredEntityState<T>
  ): DeferredEntitySelectors<T, any> {
    // Select unmerged, unfilterd entities and ids
    const selectIds = (state: DeferredEntityState<T>) => state.ids;
    const selectEntities = (state: DeferredEntityState<T>) => state.entities;

    // Select all but deleted entities (draft safe because new object returnd)
    const selectAvailableEntities = createDraftSafeSelector(
      selectEntities,
      (entities) => {
        const availible: Record<string, T> = {};
        for (const id of Object.keys(entities)) {
          if (!entities[id].changes.deleted) {
            const { deleted, added, ...filteredChanges } = entities[id].changes;
            availible[id] = { ...entities[id].saved, ...filteredChanges };
          }
        }
        return availible;
      }
    );

    // Select all but deleted ids (draft safe because new object returnd)
    const selectAvailableIds = createDraftSafeSelector(
      [selectIds, selectEntities],
      (ids, entities) => {
        return ids.filter((id) => !entities[id].changes.deleted);
      }
    );

    // Select All available entity objects
    const selectAllAvailable = createDraftSafeSelector(
      selectAvailableEntities,
      (entities): T[] => Object.values(entities)
    );

    const selectId = (_: unknown, id: EntityId) => id;

    const selectById = (entities: Dictionary<T>, id: EntityId) => {
      if (Object.keys(entities)) {
        return entities[id];
      }
    };

    const selectTotal = createDraftSafeSelector(
      [selectAvailableIds],
      (ids) => ids.length
    );

    if (!selectState) {
      return {
        selectIds: selectAvailableIds,
        selectEntities: selectAvailableEntities,
        selectAll: selectAllAvailable,
        selectTotal,
        selectById: createDraftSafeSelector(
          selectAvailableEntities,
          selectId,
          selectById
        ),
      };
    }

    const selectGlobalizedEntities = createDraftSafeSelector(
      selectState as Selector<V, DeferredEntityState<T>>,
      selectAvailableEntities
    );

    return {
      selectIds: createDraftSafeSelector(selectState, selectAvailableIds),
      selectEntities: selectGlobalizedEntities,
      selectAll: createDraftSafeSelector(selectState, selectAllAvailable),
      selectTotal: createDraftSafeSelector(selectState, selectTotal),
      selectById: createDraftSafeSelector(
        selectGlobalizedEntities,
        selectId,
        selectById
      ),
    };
  }

  return { getSelectors };
}
