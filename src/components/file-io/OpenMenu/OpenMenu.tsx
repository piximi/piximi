import React from "react";
import { useDispatch } from "react-redux";
import { LayersModel } from "@tensorflow/tfjs";

import { Divider, Menu, MenuItem, MenuList } from "@mui/material";

import { useDialog } from "hooks";

import { OpenProjectMenuItem } from "../OpenProjectMenuItem";
import { OpenExampleClassifierDialog } from "../OpenExampleProjectDialog/OpenExampleProjectDialog";
import { ImportTensorflowModelDialog } from "components/common/ImportTensorflowModelDialog";

import { classifierSlice } from "store/classifier";
import { segmenterSlice } from "store/segmenter";

import { ModelType, Shape } from "types";

type OpenMenuProps = {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  open: boolean;
};

export const OpenMenu = ({ anchorEl, onClose, open }: OpenMenuProps) => {
  const {
    onClose: onCloseImportClassifierDialog,
    onOpen: onOpenImportClassifierDialog,
    open: openImportClassifierDialog,
  } = useDialog();
  const {
    onClose: onCloseImportSegmenterDialog,
    onOpen: onOpenImportSegmenterDialog,
    open: openImportSegmenterDialog,
  } = useDialog();
  const {
    onClose: onCloseExampleClassifierDialog,
    onOpen: onOpenExampleClassifierDialog,
    open: openExampleClassifier,
  } = useDialog();

  const dispatch = useDispatch();

  const importClassifierModel = (
    inputShape: Shape,
    modelName: string,
    classifierModel: any
  ) => {
    dispatch(
      classifierSlice.actions.uploadUserSelectedModel({
        inputShape: inputShape,
        modelSelection: {
          modelName: modelName + " - uploaded",
          modelType: ModelType.UserUploaded,
        },
        model: classifierModel as LayersModel,
      })
    );
  };

  const importSegmentationModel = (
    inputShape: Shape,
    modelName: string,
    classifierModel: any
  ) => {
    dispatch(
      segmenterSlice.actions.uploadUserSelectedModel({
        inputShape: inputShape,
        modelSelection: {
          modelName: modelName + " - uploaded",
          modelType: ModelType.UserUploaded,
        },
        model: classifierModel as LayersModel,
      })
    );
  };

  const onMenuDialogClose = (onDialogClose: () => void) => {
    return () => {
      onDialogClose();
      onClose();
    };
  };

  return (
    <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
      <MenuList dense variant="menu">
        <OpenProjectMenuItem onMenuClose={onClose} />
        <MenuItem onClick={onOpenExampleClassifierDialog}>
          Open example project
        </MenuItem>
        <Divider />

        <MenuItem onClick={onOpenImportClassifierDialog}>
          Import classifier model
        </MenuItem>
        <MenuItem onClick={onOpenImportSegmenterDialog}>
          Import Segmentation model
        </MenuItem>
      </MenuList>

      <OpenExampleClassifierDialog
        onClose={onMenuDialogClose(onCloseExampleClassifierDialog)}
        open={openExampleClassifier}
      />

      <ImportTensorflowModelDialog
        onClose={onMenuDialogClose(onCloseImportClassifierDialog)}
        open={openImportClassifierDialog}
        modelType={"Classifier"}
        dispatchFunction={importClassifierModel}
      />

      <ImportTensorflowModelDialog
        onClose={onMenuDialogClose(onCloseImportSegmenterDialog)}
        open={openImportSegmenterDialog}
        modelType={"Segmentation"}
        dispatchFunction={importSegmentationModel}
      />
    </Menu>
  );
};
