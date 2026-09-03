import { useCallback, useState } from "react";

import { useSelector } from "react-redux";

import { ListItemText, Menu, MenuItem } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { ExportAnnotationsDialog } from "@ImageViewer/components/dialogs";
import type { ExtendedImageObject } from "store/data/types";
import {
  selectExtendedAnnotationsByImageId,
  selectImageEntities,
  selectKindEntities,
} from "store/data/selectors";
import { useParameterizedSelector } from "store/hooks";
import {
  exportOptions,
  runAnnotationExport,
} from "core/file-io/export/runAnnotationExport";

import { HotkeyContext } from "utils/enums";

import type { AnnotationExportType } from "core/file-io/export/enums";
import type { ExportedAnnotation } from "core/file-io/export/types";

//TODO: MenuItem??

type ExportAnnotationsMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
  selectedImage?: ExtendedImageObject;
};

export const ExportAnnotationsMenu = ({
  anchorEl,
  onClose,
  open,
  selectedImage,
}: ExportAnnotationsMenuProps) => {
  const annotations = useParameterizedSelector(
    selectExtendedAnnotationsByImageId,
    selectedImage!.id,
  );
  const images = useSelector(selectImageEntities);
  const kinds = useSelector(selectKindEntities);

  const {
    onClose: handleCloseExportAnnotationsDialog,
    onOpen: handleOpenExportAnnotationsDialog,
    open: exportAnnotationsDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

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
    (_exportType: AnnotationExportType) => {
      alert("Not Yet Implemented");
      setOnProjectName(() => (userProjectName: string) => {
        const exportedAnnotations: ExportedAnnotation[] = annotations.map(
          (ann) => {
            return {
              ...ann,
              kindName: kinds[ann.kindId].name,
              imageShape: images[ann.imageId].shape,
            };
          },
        );

        void runAnnotationExport(
          _exportType,
          exportedAnnotations,
          userProjectName,
        );

        onClose();
      });
    },
    [
      setOnProjectName,
      handleOpenExportAnnotationsDialog,
      onClose,
      images,
      annotations,
      selectedImage,
    ],
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
        defaultName={""}
      />
    </>
  );
};
