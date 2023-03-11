import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ListItemText, Menu, MenuItem } from "@mui/material";
import { saveAs } from "file-saver";
import JSZip from "jszip";

import { useDialogHotkey, useMenu } from "hooks";

import {
  encodeAnnotations,
  serializeCOCOFile,
  serializeProject,
} from "utils/annotator";
import {
  saveAnnotationsAsBinaryInstanceSegmentationMasks,
  saveAnnotationsAsLabelMatrix,
  saveAnnotationsAsLabeledSemanticSegmentationMasks,
} from "utils/annotator/imageHelper";

import {
  annotationCategoriesSelector,
  projectNameSelector,
} from "store/project";
import {
  annotatorImagesSelector,
  activeImageIdSelector,
  setImageInstances,
  stagedAnnotationsSelector,
} from "store/annotator";

import { ExportAnnotationsDialog } from "./ExportAnnotationsDialog";

import { AnnotationExportType, DecodedAnnotationType, HotkeyView } from "types";

type SaveMenuProps = {
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

export const SaveMenu = ({ anchorEl, onClose, open }: SaveMenuProps) => {
  const dispatch = useDispatch();

  const activeImageId = useSelector(activeImageIdSelector);
  const images = useSelector(annotatorImagesSelector);
  const stagedAnnotations = useSelector(stagedAnnotationsSelector);
  const annotationCategories = useSelector(annotationCategoriesSelector);
  const categories = useSelector(annotationCategoriesSelector);
  const projectName = useSelector(projectNameSelector);

  const {
    anchorEl: subMenuAnchorEl,
    onClose: onSubMenuClose,
    onOpen: onSubMenuOpen,
    open: subMenuOpen,
  } = useMenu();

  const {
    onClose: onCloseSaveAnnotatorDialog,
    onOpen: onOpenSaveAnnotatorDialog,
    open: openSaveAnnotatorDialog,
  } = useDialogHotkey(HotkeyView.ExportAnnotationsDialog);

  const onMenusClose = useCallback(() => {
    onCloseSaveAnnotatorDialog();
    onSubMenuClose();
    onClose();
  }, [onCloseSaveAnnotatorDialog, onSubMenuClose, onClose]);

  useEffect(() => {
    const doEncoding = async (annotations: Array<DecodedAnnotationType>) => {
      const encoded = await encodeAnnotations(annotations);
      dispatch(
        setImageInstances({ instances: encoded, imageId: activeImageId! })
      );
    };
    open && doEncoding(stagedAnnotations);
  }, [dispatch, open, stagedAnnotations, activeImageId]);

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
  const handleMenuItemClick = useCallback(
    (exportType: AnnotationExportType) => {
      setOnProjectName(() => (userProjectName: string) => {
        let zip = new JSZip();

        switch (exportType) {
          case AnnotationExportType.PIXIMI:
            const piximiSerializedProject = serializeProject(
              images,
              categories
            );

            const data = new Blob([JSON.stringify(piximiSerializedProject)], {
              type: "application/json;charset=utf-8",
            });

            saveAs(data, `${userProjectName}.json`);

            break;

          case AnnotationExportType.COCO:
            const cocoSerializedProject = serializeCOCOFile(images, categories);

            const blob = new Blob([JSON.stringify(cocoSerializedProject)], {
              type: "application/json;charset=utf-8",
            });

            saveAs(blob, `${userProjectName}.json`);

            break;

          case AnnotationExportType.Matrix:
            Promise.all(
              saveAnnotationsAsLabelMatrix(images, annotationCategories, zip)
            ).then(() => {
              zip.generateAsync({ type: "blob" }).then((blob) => {
                saveAs(blob, `${userProjectName}.zip`);
              });
            });
            break;

          case AnnotationExportType.BinaryInstances:
            saveAnnotationsAsBinaryInstanceSegmentationMasks(
              images,
              annotationCategories,
              zip,
              userProjectName
            );

            break;

          case AnnotationExportType.LabeledInstances:
            Promise.all(
              saveAnnotationsAsLabelMatrix(
                images,
                annotationCategories,
                zip,
                true
              )
            ).then(() => {
              zip.generateAsync({ type: "blob" }).then((blob) => {
                saveAs(blob, `${userProjectName}.zip`);
              });
            });
            break;

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
            break;

          case AnnotationExportType.LabeledSemanticMasks:
            saveAnnotationsAsLabeledSemanticSegmentationMasks(
              images,
              annotationCategories,
              zip,
              userProjectName
            );
            break;
        }

        onMenusClose();
      });
      onOpenSaveAnnotatorDialog();
    },
    [
      setOnProjectName,
      onOpenSaveAnnotatorDialog,
      onMenusClose,
      annotationCategories,
      categories,
      images,
    ]
  );

  return (
    <div>
      <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
        <MenuItem onClick={onSubMenuOpen}>Export annotations as</MenuItem>
        <Menu
          id="save-annotations-as-menu"
          anchorEl={subMenuAnchorEl}
          keepMounted
          open={subMenuOpen}
          onClose={onSubMenuClose}
        >
          {exportOptions.map((option) => {
            return (
              <MenuItem
                onClick={() => handleMenuItemClick(option.type)}
                key={`exportType_${option.type}`}
              >
                <ListItemText primary={option.title} />
              </MenuItem>
            );
          })}
        </Menu>

        <ExportAnnotationsDialog
          onClose={() => {
            onMenusClose();
          }}
          open={openSaveAnnotatorDialog}
          handleSave={onProjectName!}
          defaultName={projectName}
        />
      </Menu>
    </div>
  );
};
