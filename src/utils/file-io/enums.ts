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
  TIFF_Application = "application/tiff",
  TIF_Application = "application/tif",
  DICOM = "image/dicom",
  BMP = "image/bmp",
  DICOM_APPLICATION = "application/dicom",
}

export enum METADATA_GROUP_ATTRS {
  MetadataNames = "metadata_names",
  Id = "metadata_id",
  ImageDataIds = "image_data_ids",
  Kinds = "kinds",
  Planes = "planes",
  Channels = "channels",
  Width = "width",
  Height = "height",
  BitDepth = "bit_depth",
  DefaultImageId = "defaultImageId",
  TimeSeries = "tmeseries",
}

export enum IMAGE_GROUP_ATTRS {
  ImageNames = "image_names",
  Id = "image_id",
  MetadataId = "metadata_id",
  ClassifierPartition = "classifier_partition",
  Timepoint = "timepoint",
  ActivePlane = "active_plane",
  ClassCategoryId = "class_category_id",
}

export enum ANNOTATION_GROUP_ATTRS {
  AnnotationNames = "annotation_names",
  Id = "annotation_id",
  ActivePlane = "active_plane",
  ClassCategoryId = "class_category_id",
  ClassifierPartition = "classifier_partition",
  Kind = "kind",
  Bbox = "bbox",
  Mask = "mask",
  ImageId = "image_id",
  Plane = "plane",
  Timepoint = "timepoint",
}

export enum CATEGORY_GROUP_ATTRS {
  CategoryId = "category_id",
  Color = "color",
  Name = "name",
  Kind = "kind",
}

export enum KIND_GROUP_ATTRS {
  KindId = "kind_id",
  UnknownCategoryId = "unknown_category_id",
  DisplayName = "display_name",
}

export enum CLASSIFIER_GROUP_ATTRS {
  ClassifierKinds = "classifier_kinds",
  Models = "models",
  Name = "name",
}

export enum SEGMENTER_GROUP_ATTRS {
  Name = "name",
}
