import type {
  Comparer,
  EntityId,
  DeferredEntityStateAdapter,
  DeferredEntityState,
  Deferred,
  IdSelector,
  Changes,
  DeferredEntity,
} from "./models";
import { createDeferredStateOperator } from "./deferred_state_adapter";
import { createUnsortedDeferredStateAdapter } from "./deferred_unsorted_state_adapter";
import {
  selectIdValue,
  ensureEntitiesArray,
  splitAddedDeferredEntities,
} from "./utils";

export function createSortedDeferredStateAdapter<T>(
  selectId: IdSelector<T>,
  sort: Comparer<T>
): DeferredEntityStateAdapter<T> {
  type R = DeferredEntityState<T>;

  const { removeOne, removeMany, removeAll } =
    createUnsortedDeferredStateAdapter(selectId);

  function addOneMutably(entity: T, state: R): void {
    return addManyMutably([entity], state);
  }

  function addManyMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    newEntities = ensureEntitiesArray(newEntities);

    const models = newEntities.filter(
      (model) =>
        !(selectIdValue(model, selectId) in state.entities) ||
        state.entities[selectIdValue(model, selectId)].changes.deleted
    );

    if (models.length !== 0) {
      merge(models, state);
    }
  }

  function setOneMutably(entity: T, state: R): void {
    return setManyMutably([entity], state);
  }

  function setManyMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    newEntities = ensureEntitiesArray(newEntities);
    if (newEntities.length !== 0) {
      merge(newEntities, state);
    }
  }

  function setAllMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    newEntities = ensureEntitiesArray(newEntities);
    state.entities = {};
    state.ids = [];

    addManyMutably(newEntities, state);
  }

  function updateOneMutably(update: Changes<T>, state: R): void {
    return updateManyMutably([update], state);
  }

  function updateManyMutably(
    updates: ReadonlyArray<Changes<T>>,
    state: R
  ): void {
    for (let update of updates) {
      const entityObject = state.entities[update.id];
      if (!entityObject) {
        continue;
      }

      const changes = state.entities[update.id].changes;

      Object.assign(changes, update.changes);
      state.entities[update.id].changes = changes;
    }
  }

  function upsertOneMutably(entity: T, state: R): void {
    return upsertManyMutably([entity], state);
  }

  function upsertManyMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    const [added, updated] = splitAddedDeferredEntities<T>(
      newEntities,
      selectId,
      state
    );

    updateManyMutably(updated, state);
    addManyMutably(added, state);
  }

  function areArraysEqual(a: readonly unknown[], b: readonly unknown[]) {
    if (a.length !== b.length) {
      return false;
    }

    for (let i = 0; i < a.length && i < b.length; i++) {
      if (a[i] === b[i]) {
        continue;
      }
      return false;
    }
    return true;
  }

  function merge(models: readonly T[], state: R): void {
    // Insert/overwrite all new/updated
    models.forEach((model) => {
      const id = selectId(model);
      if (!state.ids.includes(id)) {
        state.entities[id] = {
          saved: model,
          changes: { added: true } as Deferred<T>,
        };

        return;
      }
      state.entities[selectId(model)].changes = {
        ...state.entities[id].changes,
        ...model,
      };
    });

    resortEntities(state);
  }

  function resortEntities(state: R) {
    const allEntities = Object.values(state.entities).map(
      (entity: DeferredEntity<T>) => {
        return { ...entity.saved, ...entity.changes };
      }
    ) as T[];
    allEntities.sort(sort);

    const newSortedIds = allEntities.map((entity) => selectId(entity));
    const { ids } = state;

    if (!areArraysEqual(ids, newSortedIds)) {
      state.ids = newSortedIds;
    }
  }

  function reconcile(keep: boolean, state: R): void {
    let hasModifiedIds = false;
    if (keep) {
      for (const id of state.ids) {
        const changes = state.entities[id].changes;

        if (changes) {
          if (changes.deleted) {
            delete state.entities[id];
            hasModifiedIds = true;
          } else {
            const { deleted, added, ...filteredChanges } = changes;
            Object.assign(state.entities[id].saved!, filteredChanges);
            state.entities[id].changes = {};
          }
        }
      }
    } else {
      for (const id of state.ids) {
        const changes = state.entities[id].changes;

        if (changes) {
          if (changes.added) {
            delete state.entities[id];
            hasModifiedIds = true;
          } else {
            state.entities[id].changes = {};
          }
        }
      }
    }
    if (hasModifiedIds) {
      state.ids = Object.keys(state.entities);
      resortEntities(state);
    }
  }

  return {
    removeOne,
    removeMany,
    removeAll,
    addOne: createDeferredStateOperator(addOneMutably),
    updateOne: createDeferredStateOperator(updateOneMutably),
    upsertOne: createDeferredStateOperator(upsertOneMutably),
    setOne: createDeferredStateOperator(setOneMutably),
    setMany: createDeferredStateOperator(setManyMutably),
    setAll: createDeferredStateOperator(setAllMutably),
    addMany: createDeferredStateOperator(addManyMutably),
    updateMany: createDeferredStateOperator(updateManyMutably),
    upsertMany: createDeferredStateOperator(upsertManyMutably),
    reconcile: createDeferredStateOperator(reconcile),
  };
}
