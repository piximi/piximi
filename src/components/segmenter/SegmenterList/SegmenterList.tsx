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
import { ModelTask } from "types/ModelType";

export const SegmenterList = () => {
  const categories = useSelector(selectCreatedAnnotationCategories);
  const fittedSegmenter = useSelector(segmenterFittedModelSelector);
  // TODO - segmenter: remove props in name, here and everywhere
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
    model: GraphModel | LayersModel,
    modelArch: ModelArchitecture,
    graph: boolean,
    inputShape: Shape,
    modelName: string
  ) => {
    dispatch(
      segmenterSlice.actions.uploadUserSelectedModel({
        inputShape,
        modelSelection: {
          // @ts-ignore TODO - segmenter
          modelName,
          modelArch,
          graph,
        },
        model,
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
        modelTask={ModelTask.Segmentation}
        // @ts-ignore TODO - segmenter
        dispatchFunction={importSegmentationModel}
      />
      <SaveFittedModelDialog
        fittedModel={fittedSegmenter as LayersModel}
        modelName={selectedSegmenterModelProps.name}
        modelTask={ModelTask.Segmentation}
        onClose={onSaveSegmenterDialogClose}
        open={openSaveSegmenterDialog}
      />
    </>
  );
};
