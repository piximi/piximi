import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { List } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialog, useDialogHotkey, useTranslation } from "hooks";

import { ImportTensorflowModelDialog } from "components/dialogs";
import { SaveFittedModelDialog } from "components/dialogs";
import { ClassifierExecListItem } from "components/list-items";

import {
  selectClassifierModelStatus,
  selectClassifierSelectedModel,
  loadUserSelectedModel,
} from "store/slices/classifier";

import { HotkeyView, Shape } from "types";
import { ModelTask } from "types/ModelType";
import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";
import { Model } from "utils/common/models/Model";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";

export const ClassifierListNew = () => {
  const modelStatus = useSelector(selectClassifierModelStatus);
  const selectedModel = useSelector(selectClassifierSelectedModel);

  const dispatch = useDispatch();

  const t = useTranslation();

  const {
    onClose: onCloseImportClassifierDialog,
    onOpen: onOpenImportClassifierDialog,
    open: openImportClassifierDialog,
  } = useDialogHotkey(HotkeyView.ImportTensorflowModelDialog);
  const {
    onClose: onSaveClassifierDialogClose,
    onOpen: onSaveClassifierDialogOpen,
    open: openSaveClassifierDialog,
  } = useDialog();

  const importClassifierModel = (model: Model, inputShape: Shape) => {
    if (model instanceof SequentialClassifier) {
      dispatch(
        loadUserSelectedModel({
          inputShape: inputShape,
          model,
        })
      );
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(
        `Attempting to dispatch a model with task ${
          ModelTask[model.task]
        }, should be ${ModelTask[ModelTask.Classification]}`
      );
    }
  };

  return (
    <List>
      <CustomListItemButton
        primaryText={t("Load Model")}
        onClick={onOpenImportClassifierDialog}
        icon={<AddIcon />}
        tooltipText={t("Load a classification model")}
        dense
      />
      <CustomListItemButton
        primaryText={t("Save Model")}
        onClick={onSaveClassifierDialogOpen}
        icon={<SaveIcon />}
        tooltipText={t("Save the classification model")}
        dense
      />
      <ClassifierExecListItem />

      <ImportTensorflowModelDialog
        onClose={onCloseImportClassifierDialog}
        open={openImportClassifierDialog}
        modelTask={ModelTask.Classification}
        dispatchFunction={importClassifierModel}
      />
      <SaveFittedModelDialog
        model={selectedModel}
        modelStatus={modelStatus}
        onClose={onSaveClassifierDialogClose}
        open={openSaveClassifierDialog}
      />
    </List>
  );
};
