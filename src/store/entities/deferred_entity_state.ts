import type { DeferredEntityState } from "./models";

function getInitialEntityState<V>(): DeferredEntityState<V> {
  return {
    ids: [],
    entities: {},
  };
}

export function createInitialDeferredStateFactory<V>() {
  function getInitialState(): DeferredEntityState<V>;
  function getInitialState<S extends object>(
    additionalState: S
  ): DeferredEntityState<V> & S;
  function getInitialState(additionalState: any = {}): any {
    return Object.assign(getInitialEntityState(), additionalState);
  }

  return { getInitialState };
}
