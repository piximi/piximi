import type { DeferredEntityAdapter, DeferredEntityState } from "../models";
import { createDeferredEntityAdapter } from "../create_deferred_adapter";
import type { BookModel } from "./fixtures/book";
import {
  TheGreatGatsby,
  AClockworkOrange,
  AnimalFarm,
  TheHobbit,
} from "./fixtures/book";

describe("Unsorted State Adapter", () => {
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
      ids: [TheGreatGatsby.id, AClockworkOrange.id, AnimalFarm.id],
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
      ids: [TheGreatGatsby.id, AClockworkOrange.id, AnimalFarm.id],
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
          changes: { added: true, deleted: true },
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
      ids: [TheGreatGatsby.id, AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { added: true, deleted: true },
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { added: true, deleted: true },
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
      ids: [TheGreatGatsby.id, AClockworkOrange.id, AnimalFarm.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { added: true, deleted: true },
        },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { added: true, deleted: true },
        },
        [AnimalFarm.id]: {
          saved: AnimalFarm,
          changes: { added: true, deleted: true },
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

  it("should not change ids state if you attempt to update an entity that has already been added", () => {
    const withOne = adapter.addOne(state, TheGreatGatsby);
    const changes = { title: "A New Hope" };

    const withUpdates = adapter.updateOne(withOne, {
      id: TheGreatGatsby.id,
      changes,
    });

    expect(withOne.ids).toBe(withUpdates.ids);
  });

  it("should let you update many entities by id in the state", () => {
    const firstChange = { title: "First Change" };
    const secondChange = { title: "Second Change" };
    const withMany = adapter.setAll(state, [TheGreatGatsby, AClockworkOrange]);

    const withUpdates = adapter.updateMany(withMany, [
      { id: TheGreatGatsby.id, changes: firstChange },
      { id: AClockworkOrange.id, changes: secondChange },
    ]);

    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.id, AClockworkOrange.id],
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

  it("doesn't break when multiple renames of one item occur", () => {
    const withA = adapter.addOne(state, { id: "a", title: "First" });

    const withUpdates = adapter.updateMany(withA, [
      { id: "a", changes: { title: "Second" } },
      { id: "a", changes: { title: "Third" } },
    ]);

    const { ids, entities } = withUpdates;

    /*
      Original code failed with a mish-mash of values, like:
      {
        ids: [ 'c' ],
        entities: { b: { id: 'b', title: 'First' }, c: { id: 'c' } }
      }
      We now expect that only 'c' will be left:
      {
        ids: [ 'c' ],
        entities: { c: { id: 'c', title: 'First' } }
      }
    */
    expect(ids).toEqual(["a"]);
    expect(entities["a"].changes.title).toBe("Third");
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
    const firstChange = { title: "First Change" };
    const withMany = adapter.setAll(state, [TheGreatGatsby]);

    const withUpserts = adapter.upsertMany(withMany, [
      { ...TheGreatGatsby, ...firstChange },
      AClockworkOrange,
    ]);

    expect(withUpserts).toEqual({
      ids: [TheGreatGatsby.id, AClockworkOrange.id],
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

  it("should let you upsert many entities in the state when passing in a dictionary", () => {
    const firstChange = { title: "Zack" };
    const withMany = adapter.setAll(state, [TheGreatGatsby]);

    const withUpserts = adapter.upsertMany(withMany, {
      [TheGreatGatsby.id]: { ...TheGreatGatsby, ...firstChange },
      [AClockworkOrange.id]: AClockworkOrange,
    });

    expect(withUpserts).toEqual({
      ids: [TheGreatGatsby.id, AClockworkOrange.id],
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

  it("should let you add a new entity in the state with setOne()", () => {
    const withOne = adapter.setOne(state, TheGreatGatsby);
    expect(withOne).toEqual({
      ids: [TheGreatGatsby.id],
      entities: {
        [TheGreatGatsby.id]: {
          saved: TheGreatGatsby,
          changes: { added: true },
        },
      },
    });
  });

  it("should let you replace an entity in the state with setOne()", () => {
    let withOne = adapter.setOne(state, TheHobbit);
    const changeWithoutAuthor = {
      id: TheHobbit.id,
      title: "Silmarillion",
      added: true,
    };
    withOne = adapter.setOne(withOne, changeWithoutAuthor);

    expect(withOne).toEqual({
      ids: [TheHobbit.id],
      entities: {
        [TheHobbit.id]: { saved: TheHobbit, changes: changeWithoutAuthor },
      },
    });
  });

  it("should let you set many entities in the state", () => {
    const changeWithoutAuthor = {
      id: TheHobbit.id,
      title: "Silmarillion",
      added: true,
    };
    const withMany = adapter.setAll(state, [TheHobbit]);

    const withSetMany = adapter.setMany(withMany, [
      changeWithoutAuthor,
      AClockworkOrange,
    ]);

    expect(withSetMany).toEqual({
      ids: [TheHobbit.id, AClockworkOrange.id],
      entities: {
        [TheHobbit.id]: { saved: TheHobbit, changes: changeWithoutAuthor },
        [AClockworkOrange.id]: {
          saved: AClockworkOrange,
          changes: { added: true },
        },
      },
    });
  });

  it("should let you set many entities in the state when passing in a dictionary", () => {
    const changeWithoutAuthor = {
      id: TheHobbit.id,
      title: "Silmarillion",
      added: true,
    };
    const withMany = adapter.setAll(state, [TheHobbit]);

    const withSetMany = adapter.setMany(withMany, {
      [TheHobbit.id]: changeWithoutAuthor,
      [AClockworkOrange.id]: AClockworkOrange,
    });

    expect(withSetMany).toEqual({
      ids: [TheHobbit.id, AClockworkOrange.id],
      entities: {
        [TheHobbit.id]: { saved: TheHobbit, changes: changeWithoutAuthor },
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
      ids: [TheGreatGatsby.id, AClockworkOrange.id, AnimalFarm.id],
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
      ids: [],
      entities: {},
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
