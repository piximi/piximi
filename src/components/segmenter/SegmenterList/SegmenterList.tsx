import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, IconButton, Tooltip } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useDialog, useDialogHotkey } from "hooks";

import { ImportTensorflowModelDialog } from "components/common/dialogs";
import { CollapsibleList } from "components/common/styled-components/CollapsibleList";
import { SaveFittedModelDialog } from "components/file-io/dialogs/SaveFittedModelDialog";
import { CategoriesList } from "components/categories/CategoriesList";
import { SegmenterExecListItem } from "../SegmenterExecListItem";

import { dataSlice, selectCreatedAnnotationCategories } from "store/data";

import {
  segmenterModelSelector,
  segmenterModelStatusSelector,
  segmenterSlice,
} from "store/segmenter";

<<<<<<< HEAD
import { CategoryType, HotkeyView, Shape } from "types";
||||||| parent of aea4e5ca ([mod] Add model architecture to type)
import { CategoryType, HotkeyView, ModelType, Shape } from "types";
=======
import { CategoryType, HotkeyView, TheModel, Shape } from "types";
>>>>>>> aea4e5ca ([mod] Add model architecture to type)
import { APPLICATION_COLORS } from "utils/common/colorPalette";
<<<<<<< HEAD
import { ModelTask } from "types/ModelType";
import { Model } from "utils/common/models/Model";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";
import { CocoSSD } from "utils/common/models/CocoSSD/CocoSSD";
||||||| parent of aea4e5ca ([mod] Add model architecture to type)
=======
import { ModelArchitecture } from "types/ModelType";
>>>>>>> aea4e5ca ([mod] Add model architecture to type)

export const SegmenterList = () => {
  const categories = useSelector(selectCreatedAnnotationCategories);

  const dispatch = useDispatch();

  const selectedModel = useSelector(segmenterModelSelector);
  const modelStatus = useSelector(segmenterModelStatusSelector);

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
      // TODO - segmenter: generalize this to something like if model.requiredCategories
      if (model instanceof CocoSSD) {
        await model.loadModel();

<<<<<<< HEAD
        const cocoCategories = model.constructCategories();
        dispatch(
          dataSlice.actions.setAnnotationCategories({
            annotationCategories: cocoCategories,
            isPermanent: true,
          })
        );
      }

      dispatch(
        segmenterSlice.actions.uploadUserSelectedModel({
          inputShape,
          model,
        })
      );
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(
        `Attempting to dispatch a model with task ${
          ModelTask[model.task]
        }, should be ${ModelTask[ModelTask.Segmentation]}`
      );
    }
||||||| parent of aea4e5ca ([mod] Add model architecture to type)
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
=======
  const importSegmentationModel = (
    inputShape: Shape,
    modelName: string,
    theModel: number,
    segmentationModel: any,
    modelArch: ModelArchitecture
  ) => {
    dispatch(
      segmenterSlice.actions.uploadUserSelectedModel({
        inputShape: inputShape,
        modelSelection: {
          modelName: modelName,
          theModel: theModel as TheModel,
          modelArch: modelArch,
        },
        model: segmentationModel as GraphModel,
      })
    );
>>>>>>> aea4e5ca ([mod] Add model architecture to type)
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
        dispatchFunction={importSegmentationModel}
      />
      <SaveFittedModelDialog
<<<<<<< HEAD
        model={selectedModel}
        modelStatus={modelStatus}
||||||| parent of aea4e5ca ([mod] Add model architecture to type)
        fittedModel={fittedSegmenter as LayersModel}
        modelProps={selectedSegmenterModelProps}
        modelTypeString={"Segmenter"}
=======
        fittedModel={fittedSegmenter as LayersModel}
        modelProps={selectedSegmenterModelProps}
        modelKind={"Segmenter"}
>>>>>>> aea4e5ca ([mod] Add model architecture to type)
        onClose={onSaveSegmenterDialogClose}
        open={openSaveSegmenterDialog}
      />
    </>
  );
};
