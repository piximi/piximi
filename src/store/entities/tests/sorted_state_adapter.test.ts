import type { DeferredEntityAdapter, DeferredEntityState } from "../models";
import { createDeferredEntityAdapter } from "../create_deferred_adapter";
import { createAction } from "@reduxjs/toolkit";
import type { BookModel } from "./fixtures/book";
import {
  TheGreatGatsby,
  AClockworkOrange,
  AnimalFarm,
  TheHobbit,
} from "./fixtures/book";

describe("Sorted State Adapter", () => {
  let adapter: DeferredEntityAdapter<BookModel>;
  let state: DeferredEntityState<BookModel>;

  beforeAll(() => {
    //eslint-disable-next-line
    Object.defineProperty(Array.prototype, "unwantedField", {
      enumerable: true,
      configurable: true,
      value: "This should not appear anywhere",
    });
  });

  afterAll(() => {
    delete (Array.prototype as any).unwantedField;
  });

  beforeEach(() => {
    adapter = createDeferredEntityAdapter({
      selectId: (book: BookModel) => book.id,
      sortComparer: (a, b) => {
        return a.title.localeCompare(b.title);
      },
    });

    state = { ids: [], entities: {} };
  });

  it("should let you add one entity to the state", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby);

    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { added: true },
        },
      },
    });
  });

  it("should let you add one entity to the state as an FSA", () => {
    const bookAction = createAction<BookModel>("books/add");
    const withOneEntity = adapter.addOne(state, bookAction(TheGreatGatsby));

    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { added: true },
        },
      },
    });
  });

  it("should not change state if you attempt to re-add an entity", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby);

    const readded = adapter.addOne(withOneEntity, TheGreatGatsby);

    expect(readded).toBe(withOneEntity);
  });

  it("should let you add many entities to the state", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby);

    const withManyMore = adapter.addMany(withOneEntity, [
      AClockworkOrange,
      AnimalFarm,
    ]);

    expect(withManyMore).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { added: true },
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { added: true },
        },
        [AnimalFarm.id]: {
          saved: AnimalFarm,
          changes: { added: true },
        },
      },
    });
  });

  it("should let you add many entities to the state from a dictionary", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby);

    const withManyMore = adapter.addMany(withOneEntity, {
      [AClockworkOrange.id]: AClockworkOrange,
      [AnimalFarm.id]: AnimalFarm,
    });

    expect(withManyMore).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { added: true },
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { added: true },
        },
        [AnimalFarm.id]: {
          saved: AnimalFarm,
          changes: { added: true },
        },
      },
    });
  });

  it("should remove existing and add new ones on setAll", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby);

    const withAll = adapter.setAll(withOneEntity, [
      AClockworkOrange,
      AnimalFarm,
    ]);

    expect(withAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { added: true },
        },
        [AnimalFarm.id]: {
          saved: AnimalFarm,
          changes: { added: true },
        },
      },
    });
  });

  it("should remove existing and add new ones on setAll when passing in a dictionary", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby);

    const withAll = adapter.setAll(withOneEntity, {
      [AClockworkOrange.id]: AClockworkOrange,
      [AnimalFarm.id]: AnimalFarm,
    });

    expect(withAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { added: true },
        },
        [AnimalFarm.id]: {
          saved: AnimalFarm,
          changes: { added: true },
        },
      },
    });
  });

  it("should let you add remove an entity from the state", () => {
    const withOneEntity = adapter.addOne(state, TheGreatGatsby);

    const withoutOne = adapter.removeOne(withOneEntity, TheGreatGatsby.id);

    expect(withoutOne).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { deleted: true },
        },
      },
    });
  });

  it("should let you remove many entities by id from the state", () => {
    const withAll = adapter.setAll(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm,
    ]);

    const withoutMany = adapter.removeMany(withAll, [
      TheGreatGatsby.id,
      AClockworkOrange.id,
    ]);

    expect(withoutMany).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { deleted: true },
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { deleted: true },
        },
        [AnimalFarm.id]: {
          saved: AnimalFarm,
          changes: { added: true },
        },
      },
    });
  });

  it("should let you remove all entities from the state", () => {
    const withAll = adapter.setAll(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm,
    ]);

    const withoutAll = adapter.removeAll(withAll);

    expect(withoutAll).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { deleted: true },
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { deleted: true },
        },
        [AnimalFarm.id]: {
          saved: AnimalFarm,
          changes: { deleted: true },
        },
      },
    });
  });

  it("should let you update an entity in the state", () => {
    const withOne = adapter.addOne(state, TheGreatGatsby);
    const changes = { title: "A New Hope" };

    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes,
    });

    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: {
            ...withOne.entities[TheGreatGatsby.id].changes,
            ...changes,
          },
        },
      },
    });
  });

  it("should not change state if you attempt to update an entity that has not been added", () => {
    const withUpdates = adapter.updateOne(state, {
      id: TheGreatGatsby.id,
      changes: { title: "A New Title" },
    });

    expect(withUpdates).toBe(state);
  });

  it("should not change ids state if you attempt to update an entity that does not impact sorting", () => {
    const withAll = adapter.setAll(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm,
    ]);
    const changes = { title: "The Great Gatsby II" };

    const withUpdates = adapter.updateOne(withAll, {
      id: TheGreatGatsby.id,
      changes,
    });

    expect(withAll.ids).toBe(withUpdates.ids);
  });

  it("should resort correctly if same id but sort key update", () => {
    const withAll = adapter.setAll(state, [
      TheGreatGatsby,
      AnimalFarm,
      AClockworkOrange,
    ]);
    const changes = { title: "A New Hope" };

    const withUpdates = adapter.updateOne(withAll, {
      id: TheGreatGatsby.id,
      changes,
    });

    expect(withUpdates).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { added: true, ...changes },
        },
        [AnimalFarm.id]: {
          saved: AnimalFarm,
          changes: { added: true },
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { added: true },
        },
      },
    });
  });

  it("should maintain a stable sorting order when updating items", () => {
    interface OrderedEntity {
      id: string;
      order: number;
      ts: number;
    }
    const sortedItemsAdapter = createDeferredEntityAdapter<OrderedEntity>({
      sortComparer: (a, b) => a.order - b.order,
    });
    const withInitialItems = sortedItemsAdapter.setAll(
      sortedItemsAdapter.getInitialState(),
      [
        { id: "A", order: 1, ts: 0 },
        { id: "B", order: 2, ts: 0 },
        { id: "C", order: 3, ts: 0 },
        { id: "D", order: 3, ts: 0 },
        { id: "E", order: 3, ts: 0 },
      ]
    );

    const updated = sortedItemsAdapter.updateOne(withInitialItems, {
      id: "C",
      changes: { ts: 5 },
    });

    expect(updated.ids).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("should let you update many entities by id in the state", () => {
    const firstChange = { title: "Zack" };
    const secondChange = { title: "Aaron" };
    const withMany = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange]);

    const withUpdates = adapter.updateMany(withMany, [
      { id: TheGreatGatsby.id, changes: firstChange },
      { id: AClockworkOrange.id, changes: secondChange },
    ]);

    expect(withUpdates).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: {
            ...withMany.entities[TheGreatGatsby.id].changes,
            ...firstChange,
          },
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: {
            ...withMany.entities[AClockworkOrange.id].changes,
            ...secondChange,
          },
        },
      },
    });
  });

  it("should let you add one entity to the state with upsert()", () => {
    const withOneEntity = adapter.upsertOne(state, TheGreatGatsby);
    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { added: true },
        },
      },
    });
  });

  it("should let you update an entity in the state with upsert()", () => {
    const withOne = adapter.addOne(state, TheGreatGatsby);
    const changes = { title: "A New Hope" };

    const withUpdates = adapter.upsertOne(withOne, {
      ...TheGreatGatsby,
      ...changes,
    });
    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: {
            ...withOne.entities[TheGreatGatsby.id].changes,
            ...changes,
          },
        },
      },
    });
  });

  it("should let you upsert many entities in the state", () => {
    const firstChange = { title: "Zack" };
    const withMany = adapter.setAll(state, [TheGreatGatsby]);

    const withUpserts = adapter.upsertMany(withMany, [
      { ...TheGreatGatsby, ...firstChange },
      AClockworkOrange,
    ]);

    expect(withUpserts).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: {
            ...withMany.entities[TheGreatGatsby.id].changes,
            ...firstChange,
          },
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { added: true },
        },
      },
    });
  });

  it("should do nothing when upsertMany is given an empty array", () => {
    const withMany = adapter.setAll(state, [TheGreatGatsby]);

    const withUpserts = adapter.upsertMany(withMany, []);

    expect(withUpserts).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { added: true },
        },
      },
    });
  });

  it("should throw when upsertMany is passed undefined or null", async () => {
    const withMany = adapter.setAll(state, [TheGreatGatsby]);

    const fakeRequest = (response: null | undefined) =>
      new Promise((resolve) => setTimeout(() => resolve(response), 50));

    const undefinedBooks = (await fakeRequest(undefined)) as BookModel[];
    expect(() => adapter.upsertMany(withMany, undefinedBooks)).toThrow();

    const nullBooks = (await fakeRequest(null)) as BookModel[];
    expect(() => adapter.upsertMany(withMany, nullBooks)).toThrow();
  });

  it("should let you upsert many entities in the state when passing in a dictionary", () => {
    const firstChange = { title: "Zack" };
    const withMany = adapter.setAll(state, [TheGreatGatsby]);

    const withUpserts = adapter.upsertMany(withMany, {
      [TheGreatGatsby.id]: { ...TheGreatGatsby, ...firstChange },
      [AClockworkOrange.id]: AClockworkOrange,
    });

    expect(withUpserts).toEqual({
      ids: [AClockworkOrange.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: {
            ...withMany.entities[TheGreatGatsby.id].changes,
            ...firstChange,
          },
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { added: true },
        },
      },
    });
  });

  it("should let you add a new entity in the state with setOne() and keep the sorting", () => {
    const withMany = adapter.setAll(state, [AnimalFarm, TheHobbit]);
    const withOneMore = adapter.setOne(withMany, TheGreatGatsby);
    expect(withOneMore).toEqual({
      ids: [AnimalFarm.id, TheGreatGatsby.id, TheHobbit.id],
      entities: {
        [AnimalFarm.id]: {
          saved: AnimalFarm,
          changes: { added: true },
        },
        [TheHobbit.id]: {
          saved: TheHobbit,
          changes: { added: true },
        },
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { added: true },
        },
      },
    });
  });

  it("should let you replace an entity in the state with setOne()", () => {
    let withOne = adapter.setOne(state, TheHobbit);
    const changeWithoutAuthor = { id: TheHobbit.id, title: "Silmarillion" };
    withOne = adapter.setOne(withOne, changeWithoutAuthor);

    expect(withOne).toEqual({
      ids: [TheHobbit.id],
      entities: {
        [TheHobbit.id]: {
          saved: TheHobbit,
          changes: { ...changeWithoutAuthor, added: true },
        },
      },
    });
  });

  it("should do nothing when setMany is given an empty array", () => {
    const withMany = adapter.setAll(state, [TheGreatGatsby]);

    const withUpserts = adapter.setMany(withMany, []);

    expect(withUpserts).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { added: true },
        },
      },
    });
  });

  it("should let you set many entities in the state", () => {
    const firstChange = { id: TheHobbit.id, title: "Silmarillion" };
    const withMany = adapter.setAll(state, [TheHobbit]);

    const withSetMany = adapter.setMany(withMany, [
      firstChange,
      AClockworkOrange,
    ]);

    expect(withSetMany).toEqual({
      ids: [AClockworkOrange.id, TheHobbit.id],
      entities: {
        [TheHobbit.id]: {
          saved: TheHobbit,
          changes: { ...firstChange, added: true },
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { added: true },
        },
      },
    });
  });

  it("should let you set many entities in the state when passing in a dictionary", () => {
    const changeWithoutAuthor = { id: TheHobbit.id, title: "Silmarillion" };
    const withMany = adapter.setAll(state, [TheHobbit]);

    const withSetMany = adapter.setMany(withMany, {
      [TheHobbit.id]: changeWithoutAuthor,
      [AClockworkOrange.id]: AClockworkOrange,
    });

    expect(withSetMany).toEqual({
      ids: [AClockworkOrange.id, TheHobbit.id],
      entities: {
        [TheHobbit.id]: {
          saved: TheHobbit,
          changes: { ...changeWithoutAuthor, added: true },
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { added: true },
        },
      },
    });
  });

  it("should keep added images on saving", () => {
    const withMany = adapter.addMany(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm,
    ]);

    const withReconcileSave = adapter.reconcile(withMany, true);

    expect(withReconcileSave).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: {},
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: {},
        },
        [AnimalFarm.id]: {
          saved: AnimalFarm,
          changes: {},
        },
      },
    });
  });
  it("should remove removed images on saving", () => {
    const withMany = adapter.addMany(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm,
    ]);

    const withRemove = adapter.removeAll(withMany);
    const withReconcileSave = adapter.reconcile(withRemove, true);

    expect(withReconcileSave).toEqual({
      ids: [],
      entities: {},
    });
  });
  it("should remove added images on discarding", () => {
    const withMany = adapter.addMany(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm,
    ]);

    const withReconcileSave = adapter.reconcile(withMany, false);

    expect(withReconcileSave).toEqual({
      ids: [],
      entities: {},
    });
  });
  it("should keep images marked for deletion on discarding", () => {
    const withMany = adapter.addMany(state, [
      TheGreatGatsby,
      AClockworkOrange,
      AnimalFarm,
    ]);

    const withRemove = adapter.removeAll(withMany);
    const withReconcileSave = adapter.reconcile(withRemove, false);

    expect(withReconcileSave).toEqual({
      ids: [AClockworkOrange.id, AnimalFarm.id, TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: {},
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: {},
        },
        [AnimalFarm.id]: {
          saved: AnimalFarm,
          changes: {},
        },
      },
    });
  });

  it("should update saved images saving", () => {
    const withOne = adapter.addOne(state, TheGreatGatsby);
    const changes = { title: "A New Hope" };

    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes,
    });

    const withSaving = adapter.reconcile(withUpdates, true);

    expect(withSaving).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: { ...TheGreatGatsby, ...changes },
          changes: {},
        },
      },
    });
  });

  it("should discard changes on discarding", () => {
    const withOne = adapter.addOne(state, TheGreatGatsby);

    const withReconciled = adapter.reconcile(withOne, true);
    const changes = { title: "A New Hope" };

    const withUpdates = adapter.updateOne(withReconciled, {
      id: TheGreatGatsby.id,
      changes,
    });

    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: changes,
        },
      },
    });

    const withDiscarded = adapter.reconcile(withUpdates, false);

    expect(withDiscarded).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: {},
        },
      },
    });
  });
});
