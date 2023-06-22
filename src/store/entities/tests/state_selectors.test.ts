import { createDeferredEntityAdapter } from "../create_deferred_adapter";
import type { DeferredEntityAdapter, DeferredEntityState } from "../index";
import type {
  DeferredDictionary,
  DeferredEntitySelectors,
  Dictionary,
} from "../models";
import type { BookModel } from "./fixtures/book";
import { AClockworkOrange, AnimalFarm, TheGreatGatsby } from "./fixtures/book";
import type { Selector } from "reselect";
import { createSelector } from "reselect";

const mergeEntities = (entities: DeferredDictionary<BookModel>) => {
  const merged: Dictionary<BookModel> = {};
  for (const id of Object.keys(entities)) {
    const { deleted, added, ...filteredChanges } = entities[id].changes;
    merged[id] = { ...entities[id].saved, ...filteredChanges };
  }
  return merged;
};
//TODO: More thorough testing of selecters, exclude deleted, etc.
describe("Entity State Selectors", () => {
  describe("Composed Selectors", () => {
    interface State {
      books: DeferredEntityState<BookModel>;
    }

    let adapter: DeferredEntityAdapter<BookModel>;
    let selectors: DeferredEntitySelectors<BookModel, State>;
    let state: State;

    beforeEach(() => {
      adapter = createDeferredEntityAdapter({
        selectId: (book: BookModel) => book.id,
      });

      state = {
        books: adapter.setAll(adapter.getInitialState(), [
          AClockworkOrange,
          AnimalFarm,
          TheGreatGatsby,
        ]),
      };

      selectors = adapter.getSelectors((state: State) => state.books);
    });

    it("should create a selector for selecting the ids", () => {
      const ids = selectors.selectIds(state);

      expect(ids).toEqual(state.books.ids);
    });

    it("should create a selector for selecting the entities", () => {
      const entities = selectors.selectEntities(state);

      const mergedEntities = mergeEntities(state.books.entities);

      expect(entities).toEqual(mergedEntities);
    });

    it("should create a selector for selecting the list of models", () => {
      const models = selectors.selectAll(state);

      expect(models).toEqual([AClockworkOrange, AnimalFarm, TheGreatGatsby]);
    });

    it("should create a selector for selecting the count of models", () => {
      const total = selectors.selectTotal(state);

      expect(total).toEqual(3);
    });

    it("should create a selector for selecting a single item by ID", () => {
      const first = selectors.selectById(state, AClockworkOrange.id);
      expect(first).toEqual(AClockworkOrange);
      const second = selectors.selectById(state, AnimalFarm.id);
      expect(second).toEqual(AnimalFarm);
    });
  });

  describe("Uncomposed Selectors", () => {
    type State = DeferredEntityState<BookModel>;

    let adapter: DeferredEntityAdapter<BookModel>;
    let selectors: DeferredEntitySelectors<
      BookModel,
      DeferredEntityState<BookModel>
    >;
    let state: State;

    beforeEach(() => {
      adapter = createDeferredEntityAdapter({
        selectId: (book: BookModel) => book.id,
      });

      state = adapter.setAll(adapter.getInitialState(), [
        AClockworkOrange,
        AnimalFarm,
        TheGreatGatsby,
      ]);

      selectors = adapter.getSelectors();
    });

    it("should create a selector for selecting the ids", () => {
      const ids = selectors.selectIds(state);

      expect(ids).toEqual(state.ids);
    });

    it("should create a selector for selecting the entities", () => {
      const entities = selectors.selectEntities(state);

      const mergedEntities = mergeEntities(state.entities);

      expect(entities).toEqual(mergedEntities);
    });

    it("should type single entity from Dictionary as entity type or undefined", () => {
      expectType<
        Selector<DeferredEntityState<BookModel>, BookModel | undefined>
      >(createSelector(selectors.selectEntities, (entities) => entities[0]));
    });

    it("should create a selector for selecting the list of models", () => {
      const models = selectors.selectAll(state);

      expect(models).toEqual([AClockworkOrange, AnimalFarm, TheGreatGatsby]);
    });

    it("should create a selector for selecting the count of models", () => {
      const total = selectors.selectTotal(state);

      expect(total).toEqual(3);
    });

    it("should create a selector for selecting a single item by ID", () => {
      const first = selectors.selectById(state, AClockworkOrange.id);
      expect(first).toEqual(AClockworkOrange);
      const second = selectors.selectById(state, AnimalFarm.id);
      expect(second).toEqual(AnimalFarm);
    });
  });
});

function expectType<T>(t: T) {
  return t;
}
