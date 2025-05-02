export enum AnnotationExportType {
  LabeledSemanticMasks,
  Matrix,
  BinarySemanticMasks,
  BinaryInstances,
  LabeledInstances,
  COCO,
  PIXIMI,
}
export enum ImageShapeEnum {
  DicomImage,
  GreyScale,
  SingleRGBImage,
  HyperStackImage,
  InvalidImage,
}

export enum MIMETYPES {
  PNG = "image/png",
  JPEG = "image/jpeg",
  TIFF = "image/tiff",
  TIF = "image/tif",
  TIFF_APPLICATION = "application/tiff",
  TIF_APPLICATION = "application/tif",
  DICOM = "image/dicom",
  BMP = "image/bmp",
  DICOM_APPLICATION = "application/dicom",
}
