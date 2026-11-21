import { TiffIO } from "core/file-io/tiff-io";
import { AnnotationExportType } from "core/file-io/export/enums";

import { decodeRleArray } from "utils/image";

import type JSZip from "jszip";

import type { BaseIFD } from "core/file-io/tiff-io";

import type { ExportedAnnotation } from "./types";

/*
 * The mask formats, laid out as `piximi_schema/exports.py` documents and as
 * the engine writes them: one TIFF per image and kind (and category, or
 * object, where the format says so), pages per plane, under
 * `<name>/<image>/`. Pixels are uint16 label values, except the labeled
 * instance images, which are RGB uint8 (three pages per plane) encoding
 * object `k` as `(k & 255, k >> 8 & 255, k >> 16 & 255)`.
 */

export type LabelImage = {
  data: Uint8Array | Uint16Array;
  width: number;
  height: number;
  /* Pages in the file: planes, times three for RGB. */
  pages: number;
};

const FULL = 65535;

const sanitize = (name: string): string => name.replace(/[/\\]/g, "_");

const newLabelImage = (
  shape: ExportedAnnotation["imageShape"],
  rgb: boolean,
): LabelImage => {
  const pages = rgb ? shape.planes * 3 : shape.planes;
  const size = shape.width * shape.height * pages;
  return {
    data: rgb ? new Uint8Array(size) : new Uint16Array(size),
    width: shape.width,
    height: shape.height,
    pages,
  };
};

/* Paints `value` (or the RGB bytes of it) over the object's mask. */
const paint = (
  image: LabelImage,
  ann: ExportedAnnotation,
  value: number,
  rgb: boolean,
) => {
  const [x0, y0, x1] = ann.boundingBox;
  const boxWidth = x1 - x0;
  const mask = decodeRleArray(ann.encodedMask);
  const page = image.width * image.height;
  const channels = rgb
    ? [value & 255, (value >> 8) & 255, (value >> 16) & 255]
    : [value];
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 0) continue;
    const x = x0 + (i % boxWidth);
    const y = y0 + Math.floor(i / boxWidth);
    if (x >= image.width || y >= image.height) continue;
    for (let c = 0; c < channels.length; c++) {
      const pageIndex = rgb ? ann.planeIndex * 3 + c : ann.planeIndex;
      image.data[pageIndex * page + y * image.width + x] = channels[c];
    }
  }
};

/* Which files an export writes and what each object paints into them;
 * paths are relative to the export's top folder. */
export const layoutMaskExport = (
  annotations: ExportedAnnotation[],
  exportType: AnnotationExportType,
): Map<string, LabelImage> => {
  const files = new Map<string, LabelImage>();
  const rgb = exportType === AnnotationExportType.LabeledInstances;
  const fileFor = (ann: ExportedAnnotation, path: string): LabelImage => {
    let image = files.get(path);
    if (!image) {
      image = newLabelImage(ann.imageShape, rgb);
      files.set(path, image);
    }
    return image;
  };
  /* Per file, how many objects it holds so far (labeled instances, matrix). */
  const perFile = new Map<string, number>();
  const next = (path: string): number => {
    const n = (perFile.get(path) ?? 0) + 1;
    perFile.set(path, n);
    return n;
  };
  /* Per kind and category across the export (binary instances). */
  const perCategory = new Map<string, number>();
  /* Category index per kind, in order of first appearance (semantic). */
  const categoryIndex = new Map<string, Map<string, number>>();

  for (const ann of annotations) {
    const image = sanitize(ann.imageName);
    const kind = sanitize(ann.kindName);
    const category = sanitize(ann.categoryName);
    switch (exportType) {
      case AnnotationExportType.LabeledInstances: {
        const kindPath = `${image}/${kind}.tiff`;
        paint(fileFor(ann, kindPath), ann, next(kindPath), true);
        const categoryPath = `${image}/${kind}_${category}.tiff`;
        paint(fileFor(ann, categoryPath), ann, next(categoryPath), true);
        break;
      }
      case AnnotationExportType.LabeledSemanticMasks: {
        let indices = categoryIndex.get(ann.kindId);
        if (!indices) {
          indices = new Map();
          categoryIndex.set(ann.kindId, indices);
        }
        let index = indices.get(ann.categoryId);
        if (index === undefined) {
          index = indices.size + 1;
          indices.set(ann.categoryId, index);
        }
        paint(fileFor(ann, `${image}/${kind}.tiff`), ann, index, false);
        break;
      }
      case AnnotationExportType.BinaryInstances: {
        const key = `${ann.kindId}/${ann.categoryId}`;
        const n = perCategory.get(key) ?? 0;
        perCategory.set(key, n + 1);
        paint(
          fileFor(ann, `${image}/${kind}/${category}_${n}.tiff`),
          ann,
          FULL,
          false,
        );
        break;
      }
      case AnnotationExportType.BinarySemanticMasks:
        paint(
          fileFor(ann, `${image}/${kind}_${category}.tiff`),
          ann,
          FULL,
          false,
        );
        break;
      case AnnotationExportType.Matrix: {
        const path = `${image}/${kind}.tiff`;
        paint(fileFor(ann, path), ann, next(path), false);
        break;
      }
      default:
        throw new Error(`${exportType} is not a mask export`);
    }
  }
  return files;
};

/* An uncompressed multi-page TIFF, one strip per page. */
export const encodeLabelTiff = (image: LabelImage): Uint8Array => {
  const utif = new TiffIO();
  const bytesPerSample = image.data.BYTES_PER_ELEMENT;
  const template: BaseIFD = {
    "254": [2],
    "256": [image.width],
    "257": [image.height],
    "258": [bytesPerSample * 8],
    "259": [1],
    "262": [1],
    "273": [],
    "277": [1],
    "278": [image.height],
    "279": [image.width * image.height * bytesPerSample],
    "282": [[72, 1]],
    "283": [[72, 1]],
    "284": [1],
    "296": [1],
  };
  const { ifds, ifdBlockSize } = utif.generateIFDObject(template, image.pages);
  return new Uint8Array(utif.encodeImage(image.data, ifds, ifdBlockSize));
};

export const exportAnnotationMasks = (
  annotations: ExportedAnnotation[],
  projectName: string,
  zip: JSZip,
  exportType: AnnotationExportType,
) => {
  const root = sanitize(projectName);
  for (const [path, image] of layoutMaskExport(annotations, exportType)) {
    zip.file(`${root}/${path}`, encodeLabelTiff(image), { binary: true });
  }
};
