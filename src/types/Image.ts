import { Shape } from "./Shape";
import { Instance } from "./Instance";

export type Image = {
  categoryId?: string;
  id: string;
  name: string;
  src: string;
  shape?: Shape;
  instances: Array<Instance>;
};
