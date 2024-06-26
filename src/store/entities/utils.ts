import type {
  EntityId,
  DeferredEntityState,
  Deferred,
  IdSelector,
  Changes,
  DeferredEntity,
} from "./models";

export function selectIdValue<T>(entity: T, selectId: IdSelector<T>) {
  const key = selectId(entity);

  if (process.env.NODE_ENV !== "production" && key === undefined) {
    console.warn(
      "The entity passed to the `selectId` implementation returned undefined.",
      "You should probably provide your own `selectId` implementation.",
      "The entity that was passed:",
      entity,
      "The `selectId` implementation:",
      selectId.toString()
    );
  }

  return key;
}

export function ensureEntitiesArray<T>(
  entities: readonly T[] | Record<EntityId, T>
): readonly T[] {
  if (!Array.isArray(entities)) {
    entities = Object.values(entities);
  }

  return entities;
}

export function getProperty<T, S extends keyof T>(
  entity: T,
  property: S
): T[S] {
  return entity[property];
}

/* Deferred */

export function getCompleteEntity<T>(entity: DeferredEntity<T>): T | undefined {
  if (entity.changes.deleted) return;
  const { added, deleted, ...completeEntity } = {
    ...entity.saved,
    ...entity.changes,
  };
  return completeEntity as T;
}
export function getDeferredProperty<T, S extends keyof T>(
  entity: DeferredEntity<T>,
  property: S
): T[S] | NonNullable<Deferred<T>[S]> {
  return entity.changes[property] ?? entity.saved[property];
}

export function splitAddedDeferredEntities<T>(
  newEntities: readonly T[] | Record<EntityId, T>,
  selectId: IdSelector<T>,
  state: DeferredEntityState<T>
): [T[], Changes<T>[], T[]] {
  newEntities = ensureEntitiesArray(newEntities);

  const added: T[] = [];
  const updated: Changes<T>[] = [];
  const reset: T[] = [];

  for (const entity of newEntities) {
    const id = selectDeferredIdValue(entity, selectId);
    if (id in state.entities) {
      if (state.entities[id].changes.deleted) {
        reset.push(entity as T);
      } else {
        const { id, ...withoutId } = entity as any;

        updated.push({ id, changes: withoutId as Deferred<T> });
      }
    } else {
      added.push(entity);
    }
  }
  return [added, updated, reset];
}

export function selectDeferredIdValue<T>(entity: T, selectId: IdSelector<T>) {
  const key = selectId(entity);

  if (process.env.NODE_ENV !== "production" && key === undefined) {
    console.warn(
      "The entity passed to the `selectId` implementation returned undefined.",
      "You should probably provide your own `selectId` implementation.",
      "The entity that was passed:",
      entity,
      "The `selectId` implementation:",
      selectId.toString()
    );
  }

  return key;
}
