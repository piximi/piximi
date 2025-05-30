import { Image } from "image-js";
import { AnnotationTool } from "./AnnotationTool";
import { AnnotationState } from "../enums";

/*
 * Rather than having operator possibly undefined,
 * in `useAnnotationTool` we have a "Dummy" Annotation Tool
 * which implements the AnnotationTool Abstract class
 * but via dummy methods, or minimal methods
 * That way we don't have to do annotationTool checks
 * in the Stage, its children component and its hooks
 */
export class BlankAnnotationTool extends AnnotationTool {
  constructor(image?: Image) {
    const defaultImage = image ?? new Image();
    super(defaultImage);
  }

  deselect() {
    this.origin = undefined;
    this.annotation = undefined;

    this.setBlank();
  }

  onMouseDown(_position: { x: number; y: number }) {
    if (this.annotationState === AnnotationState.Annotated) return;

    this.setAnnotating();
  }

  onMouseMove(_position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating) return;
  }

  onMouseUp(_position: { x: number; y: number }) {
    if (this.annotationState !== AnnotationState.Annotating) return;

    this.setAnnotated();
  }
}
