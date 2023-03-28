import React from "react";
import { LayersModel } from "@tensorflow/tfjs";
import { useDispatch, useSelector } from "react-redux";

import { Divider, IconButton, Tooltip } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialog, useDialogHotkey } from "hooks";

import { ImportTensorflowModelDialog } from "components/common/ImportTensorflowModelDialog";
import { SaveFittedModelDialog } from "components/file-io/SaveFittedModelDialog";
import { CollapsibleList } from "components/common/CollapsibleList";
import { ClassifierExecListItem } from "../ClassifierExecListItem";
import { CategoriesList } from "components/categories/CategoriesList";

import {
  classifierFittedSelector,
  classifierPredictedSelector,
  classifierSelectedModelSelector,
  uploadUserSelectedModel,
} from "store/classifier";

import { selectCreatedCategories } from "store/data";

import { Category, CategoryType, HotkeyView, ModelType, Shape } from "types";
import { APPLICATION_COLORS } from "utils/common/colorPalette";
import { UNKNOWN_CLASS_CATEGORY } from "types/Category";

export const ClassifierList = () => {
  const categories = useSelector(selectCreatedCategories);
  const unknownCategory = UNKNOWN_CLASS_CATEGORY;
  const predicted = useSelector(classifierPredictedSelector);
  const fittedClassifier = useSelector(classifierFittedSelector);
  const selectedClassifierModelProps = useSelector(
    classifierSelectedModelSelector
  );

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

  const onCategoryClickCallBack = (category: Category) => {};

  const importClassifierModel = (
    inputShape: Shape,
    modelName: string,
    classifierModel: any
  ) => {
    dispatch(
      uploadUserSelectedModel({
        inputShape: inputShape,
        modelSelection: {
          modelName: modelName + " - uploaded",
          modelType: ModelType.UserUploaded,
        },
        model: classifierModel as LayersModel,
      })
    );
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
        secondary={ClassifierIOButtons}
      >
        <>
          <CategoriesList
            createdCategories={categories}
            unknownCategory={unknownCategory}
            predicted={predicted}
            categoryType={CategoryType.ClassifierCategory}
            onCategoryClickCallBack={onCategoryClickCallBack}
          />

          <Divider />

          <ClassifierExecListItem />
        </>
      </CollapsibleList>
      <ImportTensorflowModelDialog
        onClose={onCloseImportClassifierDialog}
        open={openImportClassifierDialog}
        modelKind={"Classification"}
        dispatchFunction={importClassifierModel}
      />
      <SaveFittedModelDialog
        fittedModel={fittedClassifier}
        modelProps={selectedClassifierModelProps}
        modelTypeString={"Classifier"}
        onClose={onSaveClassifierDialogClose}
        open={openSaveClassifierDialog}
      />
    </>
  );
};
