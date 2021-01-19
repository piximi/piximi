import { Selection } from "./Selection";

export class EllipticalSelection extends Selection {
  public center?: { x: number; y: number };
  public origin?: { x: number; y: number };
  public radius?: { x: number; y: number };

  public onMouseDown(position: { x: number; y: number }): void {
    this.origin = position;
  }

  public onMouseMove(position: { x: number; y: number }): void {
    if (this.origin) {
      this.center = {
        x: (position.x - this.origin.x) / 2 + this.origin.x,
        y: (position.y - this.origin.y) / 2 + this.origin.y,
      };

      this.radius = {
        x: Math.abs((position.x - this.origin.x) / 2),
        y: Math.abs((position.y - this.origin.y) / 2),
      };
    }
  }

  public onMouseUp(position: { x: number; y: number }): void {}
}
