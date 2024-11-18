import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ListItemText, Menu, MenuItem } from "@mui/material";
import { saveAs } from "file-saver";
import JSZip from "jszip";

import { useDialogHotkey } from "hooks";

import { serializeCOCOFile, serializeProject } from "utils/annotator";

import {
  selectHasUnsavedChanges,
  selectProjectName,
} from "store/project/selectors";

import { ExportAnnotationsDialog } from "sections/dialogs";
import { ConfirmationDialog } from "components/ConfirmationDialog";

import { HotkeyContext } from "utils/common/enums";
import {
  selectImageViewerObjects,
  selectImageViewerImages,
  selectImageViewerObjectDict,
  selectImageViewerImageDict,
} from "store/imageViewer/reselectors";
import {
  selectAllObjectCategories,
  selectAllObjectKinds,
  selectObjectCategoryDict,
} from "store/data/selectors";
import { AnnotationExportType } from "utils/file-io/enums";
import { dataSlice } from "store/data";
import { exportAnnotationMasks } from "utils/file-io/export/annotationExporters";

type ExportAnnotationsMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
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

export const ExportAnnotationsMenu = ({
  anchorEl,
  onClose,
  open,
}: ExportAnnotationsMenuProps) => {
  const dispatch = useDispatch();
  const images = useSelector(selectImageViewerImages);
  const imageDict = useSelector(selectImageViewerImageDict);
  const annotations = useSelector(selectImageViewerObjects);
  const annotationDict = useSelector(selectImageViewerObjectDict);
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
    onClose();
  };

  const handleSaveChanges = () => {
    dispatch(dataSlice.actions.reconcile({ keepChanges: true }));
    handleOpenExportAnnotationsDialog();
  };

  const onMenuClose = useCallback(() => {
    handleCloseExportAnnotationsDialog();
    onClose();
  }, [onClose, handleCloseExportAnnotationsDialog]);

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
        let zip = new JSZip();

        switch (exportType) {
          case AnnotationExportType.PIXIMI:
            const piximiSerializedProject = serializeProject(
              images,
              annotations,
              annotationCategories,
              objectKinds
            );

            const data = new Blob([JSON.stringify(piximiSerializedProject)], {
              type: "application/json;charset=utf-8",
            });

            saveAs(data, `${userProjectName}.json`);

            break;

          case AnnotationExportType.COCO:
            const cocoSerializedProject = serializeCOCOFile(
              images,
              annotations,
              annotationCategories
            );

            const blob = new Blob([JSON.stringify(cocoSerializedProject)], {
              type: "application/json;charset=utf-8",
            });

            saveAs(blob, `${userProjectName}.json`);

            break;

          default:
            exportAnnotationMasks(
              imageDict,
              annotationDict,
              annotationCategoryDict,
              userProjectName,
              zip,
              exportType
            );
            zip.generateAsync({ type: "blob" }).then((blob) => {
              saveAs(blob, `${userProjectName}.zip`);
            });

            break;
        }

        onClose();
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
      onClose,
      annotationCategories,
      images,
      objectKinds,
      annotations,
      imageDict,
      annotationDict,
      annotationCategoryDict,
      hasUnsavedChanges,
      handleOpenSaveChangesDialog,
    ]
  );

  return (
    <>
      <Menu
        id="save-annotations-as-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={onMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {exportOptions.map((option) => {
          return (
            <MenuItem
              onClick={() => _handleMenuItemClick(option.type)}
              key={`exportType_${option.type}`}
            >
              <ListItemText
                primaryTypographyProps={{ variant: "body2" }}
                primary={option.title}
              />
            </MenuItem>
          );
        })}
      </Menu>

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
    </>
  );
};
