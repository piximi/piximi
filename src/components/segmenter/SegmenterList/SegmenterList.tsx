import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, IconButton } from "@mui/material";
import { Add as AddIcon, Save as SaveIcon } from "@mui/icons-material";
import { CategoriesList } from "components/categories/CategoriesList";
import { SegmenterExecListItem } from "../SegmenterExecListItem";

import {
  createdAnnotatorCategoriesSelector,
  unknownAnnotationCategorySelector,
} from "store/project";

import { CategoryType, HotkeyView, ModelType, Shape } from "types";
import { APPLICATION_COLORS } from "utils/common/colorPalette";
import { CollapsibleList } from "components/common/CollapsibleList";
import { useDialog, useDialogHotkey } from "hooks";
import {
  segmenterArchitectureOptionsSelector,
  segmenterFittedModelSelector,
  segmenterSlice,
} from "store/segmenter";
import { GraphModel, LayersModel } from "@tensorflow/tfjs";
import { ImportTensorflowModelDialog } from "components/common/ImportTensorflowModelDialog";
import { SaveFittedModelDialog } from "components/file-io/SaveFittedModelDialog";

export const SegmenterList = () => {
  const categories = useSelector(createdAnnotatorCategoriesSelector);
  const unknownCategory = useSelector(unknownAnnotationCategorySelector);

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

  const dispatch = useDispatch();

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
          modelName:
            modelName === "Stardist Versitile H&E"
              ? "Stardist Versitile H&E"
              : modelName + " - uploaded",
          modelType:
            modelName === "Stardist Versitile H&E"
              ? ModelType.StardistVHE
              : ModelType.UserUploaded,
          modelArch: modelArch,
        },
        model: segmentationModel as GraphModel,
      })
    );
  };

  const fittedSegmenter = useSelector(segmenterFittedModelSelector);
  const selectedSegmenterModelProps = useSelector(
    segmenterArchitectureOptionsSelector
  ).selectedModel;

  const addSegmenterButton = (
    <>
      <IconButton
        size="small"
        edge="end"
        aria-label="comments"
        onClick={onOpenImportSegmenterDialog}
      >
        <AddIcon />
      </IconButton>
      <IconButton
        size="small"
        edge="end"
        aria-label="comments"
        onClick={onSaveSegmenterDialogOpen}
      >
        <SaveIcon />
      </IconButton>
    </>
  );

  return (
    <>
      <CollapsibleList
        dense
        backgroundColor={APPLICATION_COLORS.segmenterList}
        primary="Segmenter"
        secondary={addSegmenterButton}
      >
        <>
          <CategoriesList
            createdCategories={categories}
            unknownCategory={unknownCategory}
            predicted={false}
            categoryType={CategoryType.AnnotationCategory}
            onCategoryClickCallBack={() => {
              return;
            }}
          />

          <Divider />

          <SegmenterExecListItem />
        </>
      </CollapsibleList>
      <ImportTensorflowModelDialog
        onClose={onCloseImportSegmenterDialog}
        open={openImportSegmenterDialog}
        modelType={"Segmentation"}
        dispatchFunction={importSegmentationModel}
      />
      <SaveFittedModelDialog
        fittedModel={fittedSegmenter as LayersModel}
        modelProps={selectedSegmenterModelProps}
        modelTypeString={"Segmenter"}
        onClose={onSaveSegmenterDialogClose}
        open={openSaveSegmenterDialog}
      />
    </>
  );
};
