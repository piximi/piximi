import { HistoryStateType } from "../../types/HistoryStateType";

export const exposureSelector = ({ state }: { state: HistoryStateType }) => {
  return state.present.exposure;
};
