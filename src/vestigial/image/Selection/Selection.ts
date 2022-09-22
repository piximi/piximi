export abstract class Selection {
  public abstract onMouseDown(position: { x: number; y: number }): void;

  public abstract onMouseMove(position: { x: number; y: number }): void;

  public abstract onMouseUp(position: { x: number; y: number }): void;
}
