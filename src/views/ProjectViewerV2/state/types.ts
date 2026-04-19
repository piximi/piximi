import { Thing } from "store/data/types";
import { ThingSortKey } from "utils/enums";
import { FilterType } from "utils/types";

export type ProjectState = {
  name: string;

  selectedThingIds: Array<string>;
  sortType: ThingSortKey;
  thingFilters: Record<
    string, // kind
    Required<Pick<FilterType<Thing>, "categoryId" | "partition">>
  >;
  highlightedCategory: string | undefined;
  activeKind: string;
  kindTabFilters: string[];
  imageChannels: number | undefined;
};
