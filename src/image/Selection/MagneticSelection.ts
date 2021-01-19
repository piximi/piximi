import { Selection } from "./Selection";

export class MagneticSelection extends Selection {
  public onMouseDown(position: { x: number; y: number }): void {}

  public onMouseMove(position: { x: number; y: number }): void {}

  public onMouseUp(position: { x: number; y: number }): void {}
}
