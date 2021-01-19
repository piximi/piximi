import { Selection } from "./Selection";

export class RectangularSelection extends Selection {
  public c?: number;
  public r?: number;
  public x?: number;
  public y?: number;

  public onMouseDown(position: { x: number; y: number }): void {
    this.x = position.x;
    this.y = position.y;
  }

  public onMouseMove(position: { x: number; y: number }): void {
    if (this.x && this.y) {
      this.r = position.y - this.y;
      this.c = position.x - this.x;
    }
  }

  public onMouseUp(position: { x: number; y: number }): void {
    if (this.x && this.y) {
      this.r = position.y - this.y;
      this.c = position.x - this.x;
    }
  }
}
