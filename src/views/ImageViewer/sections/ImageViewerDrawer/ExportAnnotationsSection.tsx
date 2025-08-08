import React, { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";

import { useDialogHotkey } from "hooks";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";
import { ExportAnnotationsDialog } from "components/dialogs";

import {
  selectAllObjectCategories,
  selectAllObjectKinds,
  selectDataState,
  selectObjectCategoryDict,
} from "store/data/selectors";
import { selectProjectName } from "store/project/selectors";
import { selectHasUnsavedChanges } from "views/ImageViewer/state/imageViewer/selectors";
import {
  selectImageViewerObjects,
  selectImageViewerObjectsArray,
} from "views/ImageViewer/state/annotator/reselectors";
import {
  selectUpdatedImages,
  selectImageSeriesArray,
} from "../../state/imageViewer/reselectors";

import {
  serializeCOCOFile,
  serializePiximiAnnotations,
} from "utils/file-io/serialize";

import { HotkeyContext } from "utils/enums";
import { AnnotationExportType } from "utils/file-io/enums";
import { exportAnnotationMasks } from "utils/file-io/export/annotationExporters";
import { ImageObject, TSAnnotationObject } from "store/data/types";
import { selectChanges } from "../../state/annotator/selectors";
import { reconcileChanges } from "../../utils/annotationUtils";

//TODO: MenuItem??

type ExportAnnotationsSectionProps = {
  selectedImage?: ImageObject;
};

const exportOptions = [
  {
    title: "Piximi-formatted JSON",
    type: AnnotationExportType.PIXIMI,
  },
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
  {
    title: "Label Matrices",
    type: AnnotationExportType.Matrix,
  },
  {
    title: "COCO-formatted JSON",
    type: AnnotationExportType.COCO,
  },
];

export const ExportAnnotationsSection = ({
  selectedImage,
}: ExportAnnotationsSectionProps) => {
  const dataState = useSelector(selectDataState);
  const annotatorChanges = useSelector(selectChanges);
  const images = useSelector(selectImageSeriesArray);
  //FIX_NOW
  //const imageDict = useSelector(selectUpdatedImages);
  const annotations = useSelector(selectImageViewerObjectsArray);
  const annotationDict = useSelector(selectImageViewerObjects);
  const annotationCategories = useSelector(selectAllObjectCategories);
  const annotationCategoryDict = useSelector(selectObjectCategoryDict);
  const projectName = useSelector(selectProjectName);
  const objectKinds = useSelector(selectAllObjectKinds);
  const hasUnsavedChanges = useSelector(selectHasUnsavedChanges);

  const {
    onClose: handleCloseExportAnnotationsDialog,
    onOpen: handleOpenExportAnnotationsDialog,
    open: exportAnnotationsDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);
  const {
    onClose: handleCloseSaveChangesDialog,
    onOpen: handleOpenSaveChangesDialog,
    open: saveChangesDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleCancelSaveChanges = () => {
    handleCloseSaveChangesDialog();
  };

  const handleSaveChanges = async () => {
    await reconcileChanges(dataState, annotatorChanges);
    handleOpenExportAnnotationsDialog();
  };

  const onMenuClose = useCallback(() => {
    handleCloseExportAnnotationsDialog();
  }, [handleCloseExportAnnotationsDialog]);

  const [onProjectName, setOnProjectName] = useState<
    ((userProjectName: string) => void) | null
  >(null);

  // handleMenuItemClick will get the export type of the menu
  // item that was clicked, and will set the useState above
  // to a function that expects a project name, as well
  // as setting the flag for a dialog that gets the project name
  // when that dialog is confirmed the function in the useState
  // gets the project name, and the body of the export function
  // is invoked
  const _handleMenuItemClick = useCallback(
    (exportType: AnnotationExportType) => {
      setOnProjectName(() => (userProjectName: string) => {
        const zip = new JSZip();
        let exportedAnnotations: Record<string, TSAnnotationObject> = {};
        if (selectedImage) {
          for (const annId of selectedImage.containing) {
            exportedAnnotations[annId] = annotationDict[annId];
          }
        } else {
          exportedAnnotations = { ...annotationDict };
        }
        switch (exportType) {
          case AnnotationExportType.PIXIMI:
            //FIX_NOW
            // const piximiSerializedProject = serializePiximiAnnotations(
            //   images,
            //   annotations,
            //   annotationCategories,
            //   objectKinds,
            // );

            // const data = new Blob([JSON.stringify(piximiSerializedProject)], {
            //   type: "application/json;charset=utf-8",
            // });

            // saveAs(data, `${userProjectName}.json`);

            break;

          case AnnotationExportType.COCO:
            //FIX_NOW
            // const cocoSerializedProject = serializeCOCOFile(
            //   images,
            //   annotations,
            //   annotationCategories,
            // );

            // const blob = new Blob([JSON.stringify(cocoSerializedProject)], {
            //   type: "application/json;charset=utf-8",
            // });

            // saveAs(blob, `${userProjectName}.json`);

            break;

          default:
            //FIX_NOW
            // exportAnnotationMasks(
            //   imageDict,
            //   exportedAnnotations,
            //   annotationCategoryDict,
            //   userProjectName,
            //   zip,
            //   exportType,
            // );
            // zip.generateAsync({ type: "blob" }).then((blob) => {
            //   saveAs(blob, `${userProjectName}.zip`);
            // });

            break;
        }
      });
      if (hasUnsavedChanges) {
        handleOpenSaveChangesDialog();
      } else {
        handleOpenExportAnnotationsDialog();
      }
    },
    [
      setOnProjectName,
      handleOpenExportAnnotationsDialog,
      annotationCategories,
      images,
      objectKinds,
      annotations,
      //FIX_NOW
      //imageDict,
      annotationDict,
      annotationCategoryDict,
      hasUnsavedChanges,
      handleOpenSaveChangesDialog,
      selectedImage,
    ],
  );

  return (
    <Stack>
      <Typography
        sx={(theme) => ({
          width: "90%",
          textAlign: "center",
          mx: "auto",
          py: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        Export As
      </Typography>
      <List id="save-annotations-as-menu">
        {exportOptions.map((option) => {
          return (
            <ListItemButton
              onClick={() => _handleMenuItemClick(option.type)}
              key={`exportType_${option.type}`}
            >
              <ListItemText
                slotProps={{ primary: { variant: "body2" } }}
                primary={option.title}
              />
            </ListItemButton>
          );
        })}
      </List>

      <ExportAnnotationsDialog
        onClose={() => {
          onMenuClose();
        }}
        open={exportAnnotationsDialogOpen}
        handleSave={onProjectName!}
        defaultName={projectName}
      />
      <ConfirmationDialog
        title="Save Changes"
        content={"Save changes before exporting"}
        isOpen={saveChangesDialogOpen}
        onConfirm={handleSaveChanges}
        onClose={handleCancelSaveChanges}
      />
    </Stack>
  );
};
