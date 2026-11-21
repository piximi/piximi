/* Values are the wire's (`piximi_schema.export.AnnotationExportType`). */
export enum AnnotationExportType {
  PIXIMI = "piximi",
  COCO = "coco",
  LabeledInstances = "labeledInstances",
  LabeledSemanticMasks = "labeledSemanticMasks",
  BinaryInstances = "binaryInstances",
  BinarySemanticMasks = "binarySemanticMasks",
  Matrix = "matrix",
}
