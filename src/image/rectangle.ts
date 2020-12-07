export class Rectangle {
  public render: boolean = false;

  public x0: number;
  public y0: number;
  public x1: number;
  public y1: number;
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  constructor(x0: number, y0: number, x1: number, y1: number) {
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.x = Math.min(x0, x1);
    this.y = Math.min(y0, y1);
    this.width = Math.max(x0, x1) - Math.min(x0, x1);
    this.height = Math.max(y0, y1) - Math.min(y0, y1);
  }

  draw(context: CanvasRenderingContext2D) {
    if (this.render) {
      context.strokeRect(this.x, this.y, this.width, this.height);
    }
  }

  reset(point: { x: number; y: number }) {
    this.x0 = point.x;
    this.x1 = point.x;
    this.y0 = point.y;
    this.y1 = point.y;

    this.translate();

    this.render = true;
  }

  translate() {
    this.x = Math.min(this.x0, this.x1);
    this.y = Math.min(this.y0, this.y1);
    this.width = Math.max(this.x0, this.x1) - Math.min(this.x0, this.x1);
    this.height = Math.max(this.y0, this.y1) - Math.min(this.y0, this.y1);
  }

  update(point: { x: number; y: number }) {
    this.x1 = point.x;
    this.y1 = point.y;

    this.translate();

    this.render = true;
  }
}
