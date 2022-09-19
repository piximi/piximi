import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

/*
  The purpose of this hook is when you want to
  1) Get global state from the store
  2) Update a copy of the state locally in the component, an arbitrary number of times,
     without dispatching those state updates back to the store
  3) Until finnally commiting the final state update to the store, once

  e.g. get global state (selector) -> update local -> udpate local -> update local -> commit final state (dispatch)

  I don't think this hook provides much of a speed/performance optimization
  when there is a single component selecting and dispatching the state,
  as redux's selector-dispatch cycle is already pretty fast 
  even compared to React's useState,
  but when there are many components selecting for the updated state,
  and you only want them to receive the *final* update, then use this hook
 */
export function useLocalGlobalState<StateType, PayloadType>(
  selector: (state: any) => StateType,
  actionCreator: (payload: PayloadType) => {
    payload: PayloadType;
    type: string;
  },
  defaultStateValue: StateType
) {
  const globalState = useSelector(selector);
  const dispatch = useDispatch();

  const [localState, setLocalState] = useState<StateType>(defaultStateValue);

  useEffect(() => {
    setLocalState(globalState);
  }, [globalState]);

  const dispatchState = (payload: PayloadType) => {
    dispatch(actionCreator(payload));
  };

  return { localState, setLocalState, dispatchState };
}
