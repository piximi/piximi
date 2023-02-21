import React, { useEffect } from "react";

import { Menu, MenuItem } from "@mui/material";

import { useDialogHotkey, useMenu } from "hooks";

import { SaveAnnotationProjectDialog } from "./SaveAnnotationProjectDialog";
import { AnnotationExportType, HotkeyView, decodedAnnotationType } from "types";
import { ExportAnnotationsAsMenuItem } from "./ExportAnnotationsAsMenuItem";
import { encodeAnnotations } from "utils/annotator";
import { useDispatch, useSelector } from "react-redux";
import {
  activeImageIdSelector,
  setImageInstances,
  stagedAnnotationsSelector,
} from "store/annotator";

type SaveMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

const exportOptions = [
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
    title: "Export Annotations as COCO-formatted JSON",
    type: AnnotationExportType.COCO,
  },
];

export const SaveMenu = ({ anchorEl, onClose, open }: SaveMenuProps) => {
  const dispatch = useDispatch();
  const activeImageId = useSelector(activeImageIdSelector);
  const stagedAnnotations = useSelector(stagedAnnotationsSelector);

  const {
    onClose: onCloseSaveAnnotatorDialog,
    onOpen: onOpenSaveAnnotatorDialog,
    open: openSaveAnnotatorDialog,
  } = useDialogHotkey(HotkeyView.SaveAnnotationProjectDialog);

  const {
    anchorEl: subMenuAnchorEl,
    onClose: onSubMenuClose,
    onOpen: onSubMenuOpen,
    open: subMenuOpen,
  } = useMenu();

  const onMenusClose = () => {
    onSubMenuClose();
    onClose();
  };
  useEffect(() => {
    const doEncoding = async (annotations: Array<decodedAnnotationType>) => {
      const encoded = await encodeAnnotations(annotations);
      dispatch(
        setImageInstances({ instances: encoded, imageId: activeImageId! })
      );
    };
    doEncoding(stagedAnnotations);
  }, [dispatch, stagedAnnotations, activeImageId]);

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
              <ExportAnnotationsAsMenuItem
                key={`exportType_${option.type}`}
                handleMenuClose={onMenusClose}
                exportType={option.type}
                title={option.title}
              />
            );
          })}
        </Menu>
        <MenuItem onClick={onOpenSaveAnnotatorDialog}>
          Save Annotation Project
        </MenuItem>
      </Menu>

      <SaveAnnotationProjectDialog
        onClose={() => {
          onCloseSaveAnnotatorDialog();
          onMenusClose();
        }}
        open={openSaveAnnotatorDialog}
      />
    </div>
  );
};
