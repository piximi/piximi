// ============================================================
// v1.2 Zarr attribute names (current format)
// ============================================================

export const ZARR_METADATA_GROUP = {
  MetadataNames: "metadata_names",
  Id: "metadata_id",
  ImageDataIds: "image_data_ids",
  Kinds: "kinds",
  Planes: "planes",
  Channels: "channels",
  Width: "width",
  Height: "height",
  BitDepth: "bit_depth",
  DefaultImageId: "defaultImageId",
  TimeSeries: "tmeseries",
} as const;
export type ZARR_METADATA_GROUP_ATTRS =
  (typeof ZARR_METADATA_GROUP)[keyof typeof ZARR_METADATA_GROUP];

export const ZARR_IMAGE_GROUP = {
  ImageNames: "image_names",
  Id: "image_id",
  MetadataId: "metadata_id",
  ClassifierPartition: "classifier_partition",
  Timepoint: "timepoint",
  ActivePlane: "active_plane",
  ClassCategoryId: "class_category_id",
} as const;
export type ZARR_IMAGE_GROUP_ATTRS =
  (typeof ZARR_IMAGE_GROUP)[keyof typeof ZARR_IMAGE_GROUP];

export const ZARR_ANNOTATION_GROUP = {
  AnnotationNames: "annotation_names",
  Id: "annotation_id",
  ActivePlane: "active_plane",
  ClassCategoryId: "class_category_id",
  ClassifierPartition: "classifier_partition",
  Kind: "kind",
  Bbox: "bbox",
  Mask: "mask",
  ImageId: "image_id",
  Plane: "plane",
  Timepoint: "timepoint",
} as const;
export type ZARR_ANNOTATION_GROUP_ATTRS =
  (typeof ZARR_ANNOTATION_GROUP)[keyof typeof ZARR_ANNOTATION_GROUP];

export const ZARR_CATEGORY_GROUP = {
  CategoryId: "category_id",
  Color: "color",
  Name: "name",
  Kind: "kind",
} as const;
export type ZARR_CATEGORY_GROUP_ATTRS =
  (typeof ZARR_CATEGORY_GROUP)[keyof typeof ZARR_CATEGORY_GROUP];

export const ZARR_KIND_GROUP = {
  KindId: "kind_id",
  UnknownCategoryId: "unknown_category_id",
  DisplayName: "display_name",
} as const;
export type ZARR_KIND_GROUP_ATTRS =
  (typeof ZARR_KIND_GROUP)[keyof typeof ZARR_KIND_GROUP];

// ============================================================
// v0.1 / v0.2 / v1.1 Zarr attribute names (older formats)
// ============================================================

// v0.2 and v1.1 share the same attribute names (unified "thing" model)
export const ZARR_THING = {
  ThingNames: "thing_names",
  ThingId: "thing_id",
  ActivePlane: "active_plane",
  ClassCategoryId: "class_category_id",
  ClassifierPartition: "classifier_partition",
  Kind: "kind",
  Bbox: "bbox",
  Mask: "mask",
  ImageId: "image_id",
  Contents: "contents",
  BitDepth: "bit_depth",
} as const;
export type ZARR_THING_ATTRS = (typeof ZARR_THING)[keyof typeof ZARR_THING];

// v0.1 uses separate groups for images and annotations
export const ZARR_V01_IMAGE = {
  ImageNames: "image_names",
  ImageId: "image_id",
  ActivePlane: "active_plane",
  ClassCategoryId: "class_category_id",
  BitDepth: "bit_depth",
} as const;
export type ZARR_V01_IMAGE =
  (typeof ZARR_V01_IMAGE)[keyof typeof ZARR_V01_IMAGE];

export const ZARR_V01_ANNOTATION = {
  AnnotationId: "annotation_id",
  AnnotationCategoryId: "annotation_category_id",
  ImageId: "image_id",
} as const;
export type ZARR_V01_ANNOTATION =
  (typeof ZARR_V01_ANNOTATION)[keyof typeof ZARR_V01_ANNOTATION];

// Category/kind attrs for v0.2/v1.1 (slightly different from v1.2)
export const ZARR_V02_CATEGORY = {
  CategoryId: "category_id",
  Color: "color",
  Name: "name",
  Kind: "kind",
  Contents: "contents",
} as const;
export type ZARR_V02_CATEGORY_ATTRS =
  (typeof ZARR_V02_CATEGORY)[keyof typeof ZARR_V02_CATEGORY];

export const ZARR_V02_KIND = {
  KindId: "kind_id",
  Contents: "contents",
  Categories: "categories",
  UnknownCategoryId: "unknown_category_id",
  DisplayName: "display_name",
} as const;
export type ZARR_V02_KIND_ATTRS =
  (typeof ZARR_V02_KIND)[keyof typeof ZARR_V02_KIND];
