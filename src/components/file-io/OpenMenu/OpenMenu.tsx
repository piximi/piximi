import React from "react";
import { useDispatch } from "react-redux";
import { GraphModel, LayersModel } from "@tensorflow/tfjs";

import { Divider, Menu, MenuItem, MenuList } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { OpenProjectMenuItem } from "../OpenProjectMenuItem";
import { OpenExampleProjectDialog } from "../OpenExampleProjectDialog/OpenExampleProjectDialog";
import { ImportTensorflowModelDialog } from "components/common/ImportTensorflowModelDialog";

import { classifierSlice } from "store/classifier";
import { segmenterSlice } from "store/segmenter";

import { HotkeyView, ModelType, Shape } from "types";

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
  } = useDialogHotkey(HotkeyView.ImportTensorflowModelDialog);
  const {
    onClose: onCloseImportSegmenterDialog,
    onOpen: onOpenImportSegmenterDialog,
    open: openImportSegmenterDialog,
  } = useDialogHotkey(HotkeyView.ImportTensorflowModelDialog);
  const {
    onClose: onCloseExampleProjectDialog,
    onOpen: onOpenExampleProjectDialog,
    open: openExampleProject,
  } = useDialogHotkey(HotkeyView.ExampleClassifierDialog);

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
    segmentationModel: any,
    modelArch: string
  ) => {
    dispatch(
      segmenterSlice.actions.uploadUserSelectedModel({
        inputShape: inputShape,
        modelSelection: {
          modelName: modelName + " - uploaded",
          modelType: ModelType.UserUploaded,
          modelArch: modelArch,
        },
        model: segmentationModel as GraphModel,
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
        <MenuItem onClick={onOpenExampleProjectDialog}>
          Open example project
        </MenuItem>
        <Divider />

        <MenuItem onClick={onOpenImportClassifierDialog}>
          Import classifier model
        </MenuItem>
        {process.env.NODE_ENV === "development" && (
          <MenuItem onClick={onOpenImportSegmenterDialog}>
            Import Segmentation model
          </MenuItem>
        )}
      </MenuList>

      <OpenExampleProjectDialog
        onClose={onMenuDialogClose(onCloseExampleProjectDialog)}
        open={openExampleProject}
      />

      <ImportTensorflowModelDialog
        onClose={onMenuDialogClose(onCloseImportClassifierDialog)}
        open={openImportClassifierDialog}
        modelType={"Classification"}
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
