import { StateType } from "./StateType";

export type HistoryStateType = {
  future: Array<StateType>;
  past: Array<StateType>;
  present: StateType;
};
