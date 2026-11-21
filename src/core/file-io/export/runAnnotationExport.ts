import JSZip from "jszip";

import { AnnotationExportType } from "core/file-io/export/enums";

import { exportAnnotationMasks } from "./annotationExporters";
import { serializeCOCOFile } from "./serializeCOCO";
import { PIXIMI_ANNOTATIONS_FORMAT, PIXIMI_ANNOTATIONS_VERSION } from "./types";

import type { ExportedAnnotation, ExportedFile } from "./types";

export const exportOptions = [
  { title: "Piximi-formatted JSON", type: AnnotationExportType.PIXIMI },
  {
    title: "Labeled Instance Masks",
    type: AnnotationExportType.LabeledInstances,
  },
  {
    title: "Labeled Semantic Masks",
    type: AnnotationExportType.LabeledSemanticMasks,
  },
  {
    title: "Binary Instance Masks",
    type: AnnotationExportType.BinaryInstances,
  },
  {
    title: "Binary Semantic Masks",
    type: AnnotationExportType.BinarySemanticMasks,
  },
  { title: "Label Matrices", type: AnnotationExportType.Matrix },
  { title: "COCO-formatted JSON", type: AnnotationExportType.COCO },
];

const json = (value: unknown, name: string): ExportedFile => ({
  fileName: `${name}.json`,
  mime: "application/json",
  data: new TextEncoder().encode(JSON.stringify(value)),
});

/*
 * Renders the records as one of the formats. Shared by the in-browser
 * backends, so a format added here is what the local and the fake backend
 * both hand back; the engine's `piximi_engine/exports.py` writes the same.
 */
export const buildAnnotationExport = async (
  exportType: AnnotationExportType,
  annotations: ExportedAnnotation[],
  name: string,
): Promise<ExportedFile> => {
  switch (exportType) {
    case AnnotationExportType.PIXIMI:
      return json(
        {
          format: PIXIMI_ANNOTATIONS_FORMAT,
          version: PIXIMI_ANNOTATIONS_VERSION,
          project: name,
          annotations,
        },
        name,
      );
    case AnnotationExportType.COCO:
      return json(serializeCOCOFile(annotations), name);
    default: {
      const zip = new JSZip();
      exportAnnotationMasks(annotations, name, zip, exportType);
      return {
        fileName: `${name}.zip`,
        mime: "application/zip",
        data: await zip.generateAsync({ type: "uint8array" }),
      };
    }
  }
};
