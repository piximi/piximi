import { Category, Kind, Thing } from "store/data/types";
import { SequentialClassifier } from "utils/models/classification";

export const predictClassifier = async (
  data: Thing[],
  categories: Category[],
  kindId: Kind["id"],
  model: SequentialClassifier,
) => {};
