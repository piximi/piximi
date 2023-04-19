import type {
  EntityId,
  DeferredEntityStateAdapter,
  DeferredEntityState,
  Deferred,
  IdSelector,
  Changes,
} from "./models";
import {
  createDeferredStateOperator,
  createSingleArgumentDeferredStateOperator,
} from "./deferred_state_adapter";
import {
  selectIdValue,
  ensureEntitiesArray,
  splitAddedDeferredEntities,
  selectDeferredIdValue,
} from "./utils";

export function createUnsortedDeferredStateAdapter<T>(
  selectId: IdSelector<T>
): DeferredEntityStateAdapter<T> {
  type R = DeferredEntityState<T>;

  function addOneMutably(entity: T, state: R): void {
    const key = selectIdValue(entity, selectId);

    if (key in state.entities) {
      if (state.entities[key].changes.deleted) {
        state.entities[key].saved = entity;
        state.entities[key].changes = { added: true } as Deferred<T>;
      }
      return;
    }

    state.ids.push(key);
    state.entities[key] = {
      saved: entity,
      changes: { added: true } as Deferred<T>,
    };
  }

  function addManyMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    newEntities = ensureEntitiesArray(newEntities);

    for (const entity of newEntities) {
      addOneMutably(entity, state);
    }
  }

  function setOneMutably(entity: T, state: R): void {
    const key = selectIdValue(entity, selectId);
    if (!(key in state.entities)) {
      state.ids.push(key);
      state.entities[key] = {
        saved: entity,
        changes: { added: true } as Deferred<T>,
      };
      return;
    }
    if (state.entities[key].changes?.deleted) {
      state.entities[key] = {
        saved: entity,
        changes: { added: true } as Deferred<T>,
      };
      return;
    }
    state.entities[key].changes = entity as Deferred<T>;
  }

  function setManyMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    newEntities = ensureEntitiesArray(newEntities);
    for (const entity of newEntities) {
      setOneMutably(entity, state);
    }
  }

  function setAllMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    newEntities = ensureEntitiesArray(newEntities);

    state.ids = [];
    state.entities = {};

    addManyMutably(newEntities, state);
  }

  function removeOneMutably(key: EntityId, state: R): void {
    return removeManyMutably([key], state);
  }

  function removeManyMutably(keys: readonly EntityId[], state: R): void {
    keys.forEach((key) => {
      if (key in state.entities) {
        state.entities[key].changes = {
          deleted: true,
        } as Deferred<T>;
      }
    });
  }

  function removeAllMutably(state: R): void {
    for (const key of state.ids) {
      state.entities[key].changes = { deleted: true } as Deferred<T>;
    }
  }

  function takeNewKey(
    keys: { [id: string]: EntityId },
    update: Changes<T>,
    state: R
  ): boolean {
    const original = state.entities[update.id];
    const updatedDeferred = {
      ...state.entities[update.id].changes,
      ...update.changes,
    };
    const updated: { saved: T; changes: Deferred<T> } = Object.assign(
      {},
      original,

      { changes: updatedDeferred }
    );
    const newKey = selectDeferredIdValue(updated.saved, selectId);
    const hasNewKey = newKey !== update.id;

    if (hasNewKey) {
      keys[update.id] = newKey;
      delete state.entities[update.id];
    }

    state.entities[newKey] = updated;

    return hasNewKey;
  }

  function updateOneMutably(update: Changes<T>, state: R): void {
    return updateManyMutably([update], state);
  }

  //XXX: Test this
  function updateManyMutably(
    updates: ReadonlyArray<Changes<T>>,
    state: R
  ): void {
    const newKeys: { [id: string]: EntityId } = {};

    const updatesPerEntity: { [id: string]: Changes<T> } = {};
    updates.forEach((update) => {
      // Only apply updates to entities that currently exist

      if (update.id in state.entities) {
        // If there are multiple updates to one entity, merge them together
        updatesPerEntity[update.id] = {
          id: update.id,
          changes: {
            ...(updatesPerEntity[update.id]
              ? updatesPerEntity[update.id].changes
              : null),
            ...update.changes,
          },
        };
      }
    });

    updates = Object.values(updatesPerEntity);

    const didMutateEntities = updates.length > 0;

    if (didMutateEntities) {
      const didMutateIds =
        updates.filter((update) => takeNewKey(newKeys, update, state)).length >
        0;

      if (didMutateIds) {
        state.ids = Object.keys(state.entities);
      }
    }
  }

  function upsertOneMutably(entity: T, state: R): void {
    return upsertManyMutably([entity], state);
  }

  function upsertManyMutably(
    newEntities: readonly T[] | Record<EntityId, T>,
    state: R
  ): void {
    const [added, updated, reset] = splitAddedDeferredEntities<T>(
      newEntities,
      selectId,
      state
    );

    updateManyMutably(updated, state);
    addManyMutably(added, state);
    setManyMutably(reset, state);
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
            let { added, deleted, ...preparedDeferred } = changes;
            Object.assign(state.entities[id].saved!, preparedDeferred);
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
    }
  }

  return {
    removeAll: createSingleArgumentDeferredStateOperator(removeAllMutably),
    addOne: createDeferredStateOperator(addOneMutably),
    addMany: createDeferredStateOperator(addManyMutably),
    setOne: createDeferredStateOperator(setOneMutably),
    setMany: createDeferredStateOperator(setManyMutably),
    setAll: createDeferredStateOperator(setAllMutably),
    updateOne: createDeferredStateOperator(updateOneMutably),
    updateMany: createDeferredStateOperator(updateManyMutably),
    upsertOne: createDeferredStateOperator(upsertOneMutably),
    upsertMany: createDeferredStateOperator(upsertManyMutably),
    removeOne: createDeferredStateOperator(removeOneMutably),
    removeMany: createDeferredStateOperator(removeManyMutably),
    reconcile: createDeferredStateOperator(reconcile),
  };
}
