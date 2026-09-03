import JSZip from "jszip";
import { saveAs } from "file-saver";

import { AnnotationExportType } from "core/file-io/export/enums";

import { exportAnnotationMasks } from "./annotationExporters";
import { serializeCOCOFile } from "./serializeCOCO";

import type { ExportedAnnotation } from "./types";

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

// Shared by every "export annotations" entry point (the drawer's selection
// footer, the per-image export menu, ...) so a format added in one place
// can't drift out of sync with the others.
export const runAnnotationExport = async (
  exportType: AnnotationExportType,
  exportedAnnotations: ExportedAnnotation[],
  name: string,
): Promise<void> => {
  switch (exportType) {
    case AnnotationExportType.PIXIMI: {
      const data = new Blob([JSON.stringify(exportedAnnotations)], {
        type: "application/json;charset=utf-8",
      });
      saveAs(data, `${name}.json`);
      return;
    }
    case AnnotationExportType.COCO: {
      const cocoSerializedProject = serializeCOCOFile(exportedAnnotations);
      const blob = new Blob([JSON.stringify(cocoSerializedProject)], {
        type: "application/json;charset=utf-8",
      });
      saveAs(blob, `${name}.json`);
      return;
    }
    default: {
      const zip = new JSZip();
      exportAnnotationMasks(exportedAnnotations, name, zip, exportType);
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${name}.zip`);
      return;
    }
  }
};
