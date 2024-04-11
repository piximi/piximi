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
  Hand,
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
