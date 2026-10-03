import { AnnotationTool } from "./AnnotationTool";

export class MeasureTool extends AnnotationTool {
  distance: number = 0;

  toolTipPosition?: { x: number; y: number };

  deselect() {
    this.origin = undefined;
    this.toolTipPosition = undefined;
    this.distance = 0;
  }

  onMouseDown(position: { x: number; y: number }) {
    this.origin = position;
    this.toolTipPosition = position;
  }

  onMouseMove(position: { x: number; y: number }) {
    if (!this.origin) return;
    const diff = Math.ceil(
      Math.hypot(position.x - this.origin.x, position.y - this.origin.y),
    );
    this.distance = diff;
    this.toolTipPosition = position;
  }

  onMouseUp(_position: { x: number; y: number }) {
    this.deselect();
  }
}
