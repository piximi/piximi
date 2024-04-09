export enum AnnotationModeType {
  Add,
  Intersect,
  New,
  Subtract,
}
export enum AnnotationStateType {
  Blank, // not yet annotating
  Annotating,
  Annotated,
}
export enum ZoomModeType {
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
