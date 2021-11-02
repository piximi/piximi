import { Tool } from "../Tool";
import { KonvaEventObject } from "konva/types/Node";

export class SelectionTool extends Tool {
  onClick = (event: KonvaEventObject<MouseEvent>) => {};
}
