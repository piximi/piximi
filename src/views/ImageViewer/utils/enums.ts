/**
 * The pending operation for the next confirm — chosen *after* a stroke exists,
 * not as a sticky mode before it. `New` is the default: commit the stroke as its
 * own annotation. The rest combine operands and update the surviving one.
 */
export enum AnnotationMode {
  Add,
  Intersect,
  New,
  Subtract,
}
export enum AnnotationState {
  Blank, // not yet annotating
  Annotating,
  Annotated,
}
export enum ZoomMode {
  In,
  Out,
}
export enum ToolType {
  ColorAdjustment,
  ColorAnnotation,
  EllipticalAnnotation,
  LassoAnnotation,
  MagneticAnnotation,
  ObjectAnnotation,
  PenAnnotation,
  Pointer,
  PolygonalAnnotation,
  QuickAnnotation,
  RectangularAnnotation,
  Zoom,
  ThresholdAnnotation,
}
