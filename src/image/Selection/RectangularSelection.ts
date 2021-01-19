import { Selection } from "./Selection";

export class RectangularSelection extends Selection {
  c?: number;
  r?: number;
  x?: number;
  y?: number;

  onMouseDown(position: { x: number; y: number }): void {
    this.x = position.x;
    this.y = position.y;
  }

  onMouseMove(position: { x: number; y: number }): void {
    if (this.x && this.y) {
      this.r = position.y - this.y;
      this.c = position.x - this.x;
    }
  }

  onMouseUp(position: { x: number; y: number }): void {}
}
