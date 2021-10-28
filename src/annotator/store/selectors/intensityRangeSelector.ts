import { HistoryStateType } from "../../types/HistoryStateType";
import { ChannelType } from "../../types/ChannelType";

export const channelsSelector = ({
  state,
}: {
  state: HistoryStateType;
}): Array<ChannelType> => {
  return state.present.channels;
};
