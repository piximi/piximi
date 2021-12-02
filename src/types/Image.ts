import { Shape } from "./Shape";
import { Instance } from "./Instance";
import { Partition } from "./Partition";

export type Image = {
  categoryId?: string;
  id: string;
  name: string;
  src: string;
  shape: Shape;
  instances: Array<Instance>;
  partition: Partition;
};
