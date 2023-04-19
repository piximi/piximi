import { PayloadAction } from "@reduxjs/toolkit";
export declare type IsAny<T, True, False = never> = true | false extends (
  T extends never ? true : false
)
  ? True
  : False;

/**
 * @public
 */
export type EntityId = number | string;

/**
 * @public
 */
export type Comparer<T> = (a: T, b: T) => number;

//------------ DEFERRED ------------------

/**
 * @public
 */
export type IdSelector<T> = (model: T) => EntityId;

/**
 * @public
 */
export interface DeferredEntityDefinition<T> {
  selectId: IdSelector<T>;
  sortComparer: false | Comparer<T>;
}

/**
 * @public
 */
export type Deferred<T> = Partial<T> & {
  deleted?: boolean;
  added?: boolean;
};

/**
 * @public
 */
export type Changes<T> = { id: EntityId; changes: Deferred<T> };

/**
 * @public
 */
export type DeferredEntity<T> = {
  saved: T;
  changes: Deferred<T>;
};

/**
 * @public
 */
export interface Dictionary<T> {
  [id: string]: T;
}
/**
 * @public
 */
export interface DeferredDictionaryNum<T> {
  [id: string]: DeferredEntity<T>;
}

/**
 * @public
 */
export interface DeferredDictionary<T> extends DeferredDictionaryNum<T> {
  [id: string]: DeferredEntity<T>;
}

/**
 * @public
 */
export interface DeferredEntityState<T> {
  ids: EntityId[];
  entities: DeferredDictionary<T>;
}

export type DeferredPreventAny<S, T> = IsAny<S, DeferredEntityState<T>, S>;

/**
 * @public
 */
export interface DeferredEntityStateAdapter<T> {
  addOne<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    entity: T
  ): S;

  addOne<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    action: PayloadAction<T>
  ): S;

  addMany<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    entities: readonly T[] | Record<EntityId, T>
  ): S;
  addMany<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    entities: PayloadAction<readonly T[] | Record<EntityId, T>>
  ): S;

  setOne<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    entity: T
  ): S;
  setOne<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    action: PayloadAction<T>
  ): S;
  setMany<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    entities: readonly T[] | Record<EntityId, T>
  ): S;
  setMany<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    entities: PayloadAction<readonly T[] | Record<EntityId, T>>
  ): S;
  setAll<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    entities: readonly T[] | Record<EntityId, T>
  ): S;
  setAll<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    entities: PayloadAction<readonly T[] | Record<EntityId, T>>
  ): S;

  removeOne<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    key: EntityId
  ): S;
  removeOne<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    key: PayloadAction<EntityId>
  ): S;

  removeMany<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    keys: readonly EntityId[]
  ): S;
  removeMany<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    keys: PayloadAction<readonly EntityId[]>
  ): S;

  removeAll<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>
  ): S;

  updateOne<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    update: Changes<T>
  ): S;
  updateOne<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    update: PayloadAction<Changes<T>>
  ): S;

  updateMany<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    updates: ReadonlyArray<Changes<T>>
  ): S;
  updateMany<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    updates: PayloadAction<ReadonlyArray<Changes<T>>>
  ): S;

  upsertOne<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    entity: T
  ): S;
  upsertOne<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    entity: PayloadAction<T>
  ): S;

  upsertMany<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    entities: readonly T[] | Record<EntityId, T>
  ): S;
  upsertMany<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    entities: PayloadAction<readonly T[] | Record<EntityId, T>>
  ): S;
  reconcile<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    keep: boolean
  ): S;
  reconcile<S extends DeferredEntityState<T>>(
    state: DeferredPreventAny<S, T>,
    keep: PayloadAction<boolean>
  ): S;
}

/**
 * @public
 */
export interface DeferredEntitySelectors<T, V> {
  selectIds: (state: V) => EntityId[];
  selectEntities: (state: V) => Dictionary<T>;
  selectAll: (state: V) => T[];
  selectTotal: (state: V) => number;
  selectById: (state: V, id: EntityId) => T | undefined;
}

/**
 * @public
 */
export interface DeferredEntityAdapter<T>
  extends DeferredEntityStateAdapter<T> {
  selectId: IdSelector<T>;
  sortComparer: false | Comparer<T>;
  getInitialState(): DeferredEntityState<T>;
  getInitialState<S extends object>(state: S): DeferredEntityState<T> & S;
  getSelectors(): DeferredEntitySelectors<T, DeferredEntityState<T>>;
  getSelectors<V>(
    selectState: (state: V) => DeferredEntityState<T>
  ): DeferredEntitySelectors<T, V>;
}
