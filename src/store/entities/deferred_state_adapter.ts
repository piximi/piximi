import createNextState, { isDraft } from "immer";
import type { DeferredEntityState, DeferredPreventAny } from "./models";
import { PayloadAction } from "@reduxjs/toolkit";
function isPlainObject(value: unknown): value is object {
  if (typeof value !== "object" || value === null) return false;

  let proto = Object.getPrototypeOf(value);
  if (proto === null) return true;

  let baseProto = proto;
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }

  return proto === baseProto;
}
function isValidKey(key: string) {
  return ["type", "payload", "error", "meta"].indexOf(key) > -1;
}

export function isFSA(action: unknown): action is {
  type: string;
  payload?: unknown;
  error?: unknown;
  meta?: unknown;
} {
  return (
    isPlainObject(action) &&
    typeof (action as any).type === "string" &&
    Object.keys(action).every(isValidKey)
  );
}

export function createSingleArgumentDeferredStateOperator<V>(
  mutator: (state: DeferredEntityState<V>) => void
) {
  const operator = createDeferredStateOperator(
    (_: undefined, state: DeferredEntityState<V>) => mutator(state)
  );

  return function operation<S extends DeferredEntityState<V>>(
    state: DeferredPreventAny<S, V>
  ): S {
    return operator(state as S, undefined);
  };
}

export function createDeferredStateOperator<V, R>(
  mutator: (arg: R, state: DeferredEntityState<V>) => void
) {
  return function operation<S extends DeferredEntityState<V>>(
    state: S,
    arg: R | PayloadAction<R>
  ): S {
    function isPayloadActionArgument(
      arg: R | PayloadAction<R>
    ): arg is PayloadAction<R> {
      return isFSA(arg);
    }

    const runMutator = (draft: DeferredEntityState<V>) => {
      if (isPayloadActionArgument(arg)) {
        mutator(arg.payload, draft);
      } else {
        mutator(arg, draft);
      }
    };

    if (isDraft(state)) {
      // we must already be inside a `createNextState` call, likely because
      // this is being wrapped in `createReducer` or `createSlice`.
      // It's safe to just pass the draft to the mutator.
      runMutator(state);

      // since it's a draft, we'll just return it
      return state;
    } else {
      // @ts-ignore createNextState() produces an Immutable<Draft<S>> rather
      // than an Immutable<S>, and TypeScript cannot find out how to reconcile
      // these two types.
      return createNextState(state, runMutator);
    }
  };
}
