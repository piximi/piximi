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
