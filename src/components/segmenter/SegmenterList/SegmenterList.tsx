import React from "react";
import { GraphModel, LayersModel } from "@tensorflow/tfjs";
import { useDispatch, useSelector } from "react-redux";

import { Divider, IconButton, Tooltip } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialog, useDialogHotkey } from "hooks";

import { ImportTensorflowModelDialog } from "components/common/dialogs";
import { CollapsibleList } from "components/common/styled-components/CollapsibleList";
import { SaveFittedModelDialog } from "components/file-io/dialogs/SaveFittedModelDialog";
import { CategoriesList } from "components/categories/CategoriesList";
import { SegmenterExecListItem } from "../SegmenterExecListItem";

import { selectCreatedAnnotationCategories } from "store/data";

import {
  segmenterArchitectureOptionsSelector,
  segmenterFittedModelSelector,
  segmenterSlice,
} from "store/segmenter";

import { CategoryType, HotkeyView, ModelArchitecture, Shape } from "types";
import { APPLICATION_COLORS } from "utils/common/colorPalette";

export const SegmenterList = () => {
  const categories = useSelector(selectCreatedAnnotationCategories);
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
    modelArch: number,
    segmentationModel: any,
    graph: boolean
  ) => {
    dispatch(
      segmenterSlice.actions.uploadUserSelectedModel({
        inputShape: inputShape,
        modelSelection: {
          modelName: modelName,
          modelArch: modelArch as ModelArchitecture,
          graph: graph,
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
        closed={true}
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
        modelName={selectedSegmenterModelProps.modelName}
        modelKind={"Segmenter"}
        onClose={onSaveSegmenterDialogClose}
        open={openSaveSegmenterDialog}
      />
    </>
  );
};
