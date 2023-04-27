import React from "react";
import { GraphModel, LayersModel } from "@tensorflow/tfjs";
import { useDispatch, useSelector } from "react-redux";

import { Divider, IconButton, Tooltip } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialog, useDialogHotkey } from "hooks";

import { ImportTensorflowModelDialog } from "components/common/ImportTensorflowModelDialog";
import { SaveFittedModelDialog } from "components/file-io/SaveFittedModelDialog";
import { CategoriesList } from "components/categories/CategoriesList";
import { SegmenterExecListItem } from "../SegmenterExecListItem";
import { CollapsibleList } from "components/common/CollapsibleList";

import { selectCreatedAnnotatorCategories } from "store/data";

import {
  segmenterArchitectureOptionsSelector,
  segmenterFittedModelSelector,
  segmenterSlice,
} from "store/segmenter";

import { CategoryType, HotkeyView, ModelType, Shape } from "types";
import { APPLICATION_COLORS } from "utils/common/colorPalette";

export const SegmenterList = () => {
  const categories = useSelector(selectCreatedAnnotatorCategories);
  const fittedSegmenter = useSelector(segmenterFittedModelSelector);
  const selectedSegmenterModelProps = useSelector(
    segmenterArchitectureOptionsSelector
  ).selectedModel;

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
    modelType: number,
    segmentationModel: any,
    modelArch: string
  ) => {
    dispatch(
      segmenterSlice.actions.uploadUserSelectedModel({
        inputShape: inputShape,
        modelSelection: {
          modelName: modelName,
          modelType: modelType as ModelType,
          modelArch: modelArch,
        },
        model: segmentationModel as GraphModel,
      })
    );
  };

  const SegmenterIOButtons = (
    <>
      <Tooltip title="Import Model">
        <IconButton
          size="small"
          edge="end"
          aria-label="import segmentation model"
          onClick={onOpenImportSegmenterDialog}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Save Model">
        <IconButton
          size="small"
          edge="end"
          aria-label="save segmentation model"
          onClick={onSaveSegmenterDialogOpen}
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
        backgroundColor={APPLICATION_COLORS.segmenterList}
        primary="Segmenter"
        secondary={SegmenterIOButtons}
      >
        <>
          <CategoriesList
            createdCategories={categories}
            predicted={false}
            categoryType={CategoryType.AnnotationCategory}
          />

          <Divider />

          <SegmenterExecListItem />
        </>
      </CollapsibleList>
      <ImportTensorflowModelDialog
        onClose={onCloseImportSegmenterDialog}
        open={openImportSegmenterDialog}
        modelKind={"Segmentation"}
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
