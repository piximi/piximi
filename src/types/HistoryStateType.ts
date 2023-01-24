import { Annotator } from "./Annotator";

export type HistoryStateType = {
  future: Array<Annotator>;
  past: Array<Annotator>;
  present: Annotator;
};
