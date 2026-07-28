import { z } from "zod";

import type { ExtendedAnnotationObject, Shape } from "store/dataV2/types";

export type ExportedAnnotation = ExtendedAnnotationObject & {
  kindName: string;
  imageShape: Shape;
};
const SerializedCOCOInfoRtype = z.object({
  year: z.int(),
  version: z.string(),
  description: z.string(),
  contributor: z.string(),
  url: z.string(),
  date_created: z.string(),
});

export const SerializedCOCOImageRType = z.object({
  id: z.int(),
  width: z.int(),
  height: z.int(),
  file_name: z.string(),
  license: z.int(),
  flickr_url: z.string(),
  coco_url: z.string(),
  date_captured: z.string(),
});

const SerializedCOCOLicenseRType = z.object({
  id: z.int(),
  name: z.string(),
  url: z.string(),
});

// when iscrowd is true
const SerializedCOCORLERType = z.object({
  size: z.tuple([z.number(), z.number()]),
  counts: z.array(z.int()),
});

// when iscrowd is false
const SerializedCOCOPolygonRType = z.array(z.array(z.number()));

export const SerializedCOCOAnnotationRType = z.object({
  id: z.int(),
  image_id: z.int(),
  category_id: z.int(),
  segmentation: z.union([SerializedCOCOPolygonRType, SerializedCOCORLERType]),
  area: z.number(),
  // x, y, width, height
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  iscrowd: z.union([z.literal(0), z.literal(1)]),
});

export const SerializedCOCOCategoryRType = z.object({
  id: z.int(),
  name: z.string(),
  supercategory: z.string(),
});

export const SerializedCOCOFileRType = z.object({
  info: SerializedCOCOInfoRtype,
  images: z.array(SerializedCOCOImageRType),
  annotations: z.array(SerializedCOCOAnnotationRType),
  licenses: z.array(SerializedCOCOLicenseRType),
  categories: z.array(SerializedCOCOCategoryRType),
});

export type SerializedCOCOAnnotationType = z.infer<
  typeof SerializedCOCOAnnotationRType
>;

export type SerializedCOCOCategoryType = z.infer<
  typeof SerializedCOCOCategoryRType
>;

export type SerializedCOCOImageType = z.infer<typeof SerializedCOCOImageRType>;

export type SerializedCOCOFileType = z.infer<typeof SerializedCOCOFileRType>;
