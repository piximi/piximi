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
import { AnnotationExportType, HotkeyView } from "types";
import {
  saveAnnotationsAsBinaryInstanceSegmentationMasks,
  saveAnnotationsAsLabelMatrix,
  saveAnnotationsAsLabeledSemanticSegmentationMasks,
} from "utils/annotator/imageHelper";
import { serializeCOCOFile } from "utils/annotator";
import { serializeProject } from "utils/annotator/file-io/serializeProject";
import { useDialogHotkey } from "hooks";
import { ExportAnnotationsDialog } from "./ExportAnnotationsDialog";

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

  const onExport = (userProjectName: string) => {
    handleMenuClose();

    let zip = new JSZip();

    switch (exportType) {
      case AnnotationExportType.PIXIMI:
        const piximiSerializedProject = serializeProject(images, categories);

        const data = new Blob([JSON.stringify(piximiSerializedProject)], {
          type: "application/json;charset=utf-8",
        });

        saveAs(data, `${userProjectName}.json`);

        return;
      case AnnotationExportType.COCO:
        const cocoSerializedProject = serializeCOCOFile(images, categories);

        const blob = new Blob([JSON.stringify(cocoSerializedProject)], {
          type: "application/json;charset=utf-8",
        });

        saveAs(blob, `${userProjectName}.json`);

        return;

      case AnnotationExportType.Matrix:
        Promise.all(
          saveAnnotationsAsLabelMatrix(images, annotationCategories, zip)
        ).then(() => {
          zip.generateAsync({ type: "blob" }).then((blob) => {
            saveAs(blob, `${userProjectName}.zip`);
          });
        });
        return;

      case AnnotationExportType.BinaryInstances:
        saveAnnotationsAsBinaryInstanceSegmentationMasks(
          images,
          annotationCategories,
          zip,
          userProjectName
        );

        return;

      case AnnotationExportType.LabeledInstances:
        Promise.all(
          saveAnnotationsAsLabelMatrix(images, annotationCategories, zip, true)
        ).then(() => {
          zip.generateAsync({ type: "blob" }).then((blob) => {
            saveAs(blob, `${userProjectName}.zip`);
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
            saveAs(blob, `${userProjectName}.zip`);
          });
        });
        return;

      case AnnotationExportType.LabeledSemanticMasks:
        saveAnnotationsAsLabeledSemanticSegmentationMasks(
          images,
          annotationCategories,
          zip,
          userProjectName
        );
        return;
    }
  };

  const {
    onClose: onCloseSaveAnnotatorDialog,
    onOpen: onOpenSaveAnnotatorDialog,
    open: openSaveAnnotatorDialog,
  } = useDialogHotkey(HotkeyView.ExportAnnotationsDialog);

  return (
    <>
      <MenuItem onClick={onOpenSaveAnnotatorDialog}>
        <ListItemText primary={title} />
      </MenuItem>

      {openSaveAnnotatorDialog && (
        <ExportAnnotationsDialog
          onClose={() => {
            onCloseSaveAnnotatorDialog();
            handleMenuClose();
          }}
          open={openSaveAnnotatorDialog}
          handleSave={onExport}
          defaultName={projectName}
        />
      )}
    </>
  );
};
