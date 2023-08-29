import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, IconButton, Tooltip } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialog, useDialogHotkey } from "hooks";

import { ImportTensorflowModelDialog } from "components/dialogs";
import { SaveFittedModelDialog } from "components/dialogs";
import { CollapsibleList } from "components/common/styled-components/CollapsibleList";
import { ClassifierExecListItem } from "components/list-items";
import { CategoriesList } from "components/categories/CategoriesList";

import {
  classifierModelStatusSelector,
  classifierSelectedModelSelector,
  loadUserSelectedModel,
} from "store/classifier";

import { selectCreatedImageCategories } from "store/data";

import { CategoryType, HotkeyView, Shape } from "types";
import { APPLICATION_COLORS } from "utils/common/colorPalette";
import { ModelStatus, ModelTask } from "types/ModelType";
import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";
import { Model } from "utils/common/models/Model";

export const ClassifierList = () => {
  const categories = useSelector(selectCreatedImageCategories);

  const modelStatus = useSelector(classifierModelStatusSelector);
  const selectedModel = useSelector(classifierSelectedModelSelector);

  const dispatch = useDispatch();

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

  const ClassifierIOButtons = (
    <>
      <Tooltip title="Import Model">
        <IconButton
          size="small"
          edge="end"
          aria-label="import classification model"
          onClick={onOpenImportClassifierDialog}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Save Model">
        <IconButton
          size="small"
          edge="end"
          aria-label="save classification model"
          onClick={onSaveClassifierDialogOpen}
        >
          <SaveIcon />
        </IconButton>
      </Tooltip>
    </>
  );

  return (
    <>
      <CollapsibleList
        dense
        backgroundColor={APPLICATION_COLORS.classifierList}
        primary="Classifier"
        closed={true}
        secondary={ClassifierIOButtons}
      >
        <>
          <CategoriesList
            createdCategories={categories}
            categoryType={CategoryType.ImageCategory}
            predicted={modelStatus === ModelStatus.Suggesting}
          />

          <Divider />

          <ClassifierExecListItem />
        </>
      </CollapsibleList>
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
    </>
  );
};
