import React from "react";
import { useSelector } from "react-redux";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { annotatorImagesSelector } from "store/annotator";
import {
  annotationCategoriesSelector,
  projectNameSelector,
} from "store/project";
import { ListItemText, MenuItem } from "@mui/material";
import { AnnotationExportType } from "types";
import {
  saveAnnotationsAsBinaryInstanceSegmentationMasks,
  saveAnnotationsAsLabelMatrix,
  saveAnnotationsAsLabeledSemanticSegmentationMasks,
} from "utils/annotator/imageHelper";
import { serializeCOCOFile } from "utils/annotator";

type ExportAnnotationsAsMenuItemProps = {
  handleMenuClose: () => void;
  exportType: AnnotationExportType;
  title: string;
};
export const ExportAnnotationsAsMenuItem = ({
  handleMenuClose,
  exportType,
  title,
}: ExportAnnotationsAsMenuItemProps) => {
  const images = useSelector(annotatorImagesSelector);
  const annotationCategories = useSelector(annotationCategoriesSelector);
  const projectName = useSelector(projectNameSelector);
  const categories = useSelector(annotationCategoriesSelector);

  const onExport = () => {
    handleMenuClose();

    let zip = new JSZip();

    switch (exportType) {
      case AnnotationExportType.COCO:
        const serializedProject = serializeCOCOFile(images, categories);

        const blob = new Blob([JSON.stringify(serializedProject)], {
          type: "application/json;charset=utf-8",
        });
        saveAs(blob, `${projectName}.json`);
        return;

      case AnnotationExportType.Matrix:
        Promise.all(
          saveAnnotationsAsLabelMatrix(images, annotationCategories, zip)
        ).then(() => {
          zip.generateAsync({ type: "blob" }).then((blob) => {
            saveAs(blob, "labels.zip");
          });
        });
        return;

      case AnnotationExportType.BinaryInstances:
        saveAnnotationsAsBinaryInstanceSegmentationMasks(
          images,
          annotationCategories,
          zip
        );

        return;

      case AnnotationExportType.LabeledInstances:
        Promise.all(
          saveAnnotationsAsLabelMatrix(images, annotationCategories, zip, true)
        ).then(() => {
          zip.generateAsync({ type: "blob" }).then((blob) => {
            saveAs(blob, "labeled_instances.zip");
          });
        });
        return;

      case AnnotationExportType.BinarySemanticMasks:
        Promise.all(
          saveAnnotationsAsLabelMatrix(
            images,
            annotationCategories,
            zip,
            false,
            true
          )
        ).then(() => {
          zip.generateAsync({ type: "blob" }).then((blob) => {
            saveAs(blob, "binary_semantics.zip");
          });
        });
        return;

      case AnnotationExportType.LabeledSemanticMasks:
        saveAnnotationsAsLabeledSemanticSegmentationMasks(
          images,
          annotationCategories,
          zip
        );
        return;
    }
  };

  return (
    <MenuItem onClick={onExport}>
      <ListItemText primary={title} />
    </MenuItem>
  );
};
