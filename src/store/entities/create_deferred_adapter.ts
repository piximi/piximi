import type {
  Comparer,
  DeferredEntityAdapter,
  IdSelector,
  DeferredEntityDefinition,
} from "./models";
import { createInitialDeferredStateFactory } from "./deferred_entity_state";
import { createDeferredSelectorsFactory } from "./deferred_state_selectors";
import { createSortedDeferredStateAdapter } from "./deferred_sorted_state_adapter";
import { createUnsortedDeferredStateAdapter } from "./deferred_unsorted_state_adapter";

/**
 *
 * @param options
 *
 * @public
 */
export function createDeferredEntityAdapter<T>(
  options: {
    selectId?: IdSelector<T>;
    sortComparer?: false | Comparer<T>;
  } = {}
): DeferredEntityAdapter<T> {
  const { selectId, sortComparer }: DeferredEntityDefinition<T> = {
    sortComparer: false,
    selectId: (instance: any) => instance.id,
    ...options,
  };

  const deferredStateFactory = createInitialDeferredStateFactory<T>();

  const deferredSelectorsFactory = createDeferredSelectorsFactory<T>();

  const deferredStateAdapter = sortComparer
    ? createSortedDeferredStateAdapter(selectId, sortComparer)
    : createUnsortedDeferredStateAdapter(selectId);

  return {
    selectId,
    sortComparer,
    ...deferredStateFactory,
    ...deferredSelectorsFactory,
    ...deferredStateAdapter,
  };
}
