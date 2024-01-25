import { NewCategory, Kind } from "./Category";
import { DeferredEntityState } from "store/entities";
import { NewAnnotationType } from "./AnnotationType";
import { NewImageType } from "./ImageType";

export type NewData = {
  kinds: DeferredEntityState<Kind>;
  categories: DeferredEntityState<NewCategory>;
  things: DeferredEntityState<NewAnnotationType | NewImageType>;
};
