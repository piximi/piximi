import React, { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import { List } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialog, useDialogHotkey, useTranslation } from "hooks";

import { ImportTensorflowModelDialog } from "components/dialogs";
import { AnnotationCategoryList } from "components/lists";
import { SaveFittedModelDialog } from "components/dialogs";
import { SegmenterExecListItem } from "components/list-items";

import { selectCreatedAnnotationCategories } from "store/slices/data";

import {
  selectSegmenterModel,
  selectSegmenterModelStatus,
  segmenterSlice,
} from "store/slices/segmenter";

import { HotkeyView, Shape } from "types";
import { ModelTask } from "types/ModelType";
import { Model } from "utils/common/models/Model";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { DividerHeader, TabContext } from "components/styled-components";

export const SegmenterList = () => {
  const dispatch = useDispatch();

  const categories = useSelector(selectCreatedAnnotationCategories);
  const selectedModel = useSelector(selectSegmenterModel);
  const modelStatus = useSelector(selectSegmenterModelStatus);
  const tabIndex = useContext(TabContext);
  const t = useTranslation();

  const {
    onClose: onCloseImportSegmenterDialog,
    onOpen: onOpenImportSegmenterDialog,
    open: openImportSegmenterDialog,
  } = useDialogHotkey(HotkeyView.ImportTensorflowModelDialog);

  const {
    onClose: onSaveSegmenterDialogClose,
    onOpen: onSaveSegmenterDialogOpen,
    open: openSaveSegmenterDialog,
  } = useDialog();

  const importSegmentationModel = async (model: Model, inputShape: Shape) => {
    if (model instanceof Segmenter) {
      if (model.pretrained) {
        await model.loadModel();
      }

      dispatch(
        segmenterSlice.actions.loadUserSelectedModel({
          inputShape,
          model: model as Segmenter,
        })
      );
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(
        `Attempting to dispatch a model with task ${
          ModelTask[model.task]
        }, should be ${ModelTask[ModelTask.Segmentation]}`
      );
    }
  };

  return (
    <List>
      <CustomListItemButton
        primaryText={t("Load Model")}
        onClick={onOpenImportSegmenterDialog}
        icon={<AddIcon />}
        tooltipText={t("Load a segmentation model")}
        dense
      />
      <CustomListItemButton
        primaryText={t("Save Model")}
        onClick={onSaveSegmenterDialogOpen}
        icon={<SaveIcon />}
        tooltipText={t("Save the segmentation model")}
        dense
      />
      <SegmenterExecListItem />

      <DividerHeader sx={{ my: 1 }} textAlign="left" typographyVariant="body2">
        Categories
      </DividerHeader>

      <AnnotationCategoryList
        createdCategories={categories}
        hasPredicted={false}
        hotkeysActive={tabIndex === 1}
        changesPermanent={true}
        view="Project"
      />

      <ImportTensorflowModelDialog
        onClose={onCloseImportSegmenterDialog}
        open={openImportSegmenterDialog}
        modelTask={ModelTask.Segmentation}
        dispatchFunction={importSegmentationModel}
      />
      <SaveFittedModelDialog
        model={selectedModel}
        modelStatus={modelStatus}
        onClose={onSaveSegmenterDialogClose}
        open={openSaveSegmenterDialog}
      />
    </List>
  );
};
