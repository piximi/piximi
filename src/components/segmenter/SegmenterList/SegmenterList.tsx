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

import { selectCreatedAnnotationCategories } from "store/data";

import {
  segmenterModelSelector,
  segmenterModelStatusSelector,
  segmenterSlice,
} from "store/segmenter";

import { CategoryType, HotkeyView, Shape } from "types";
import { APPLICATION_COLORS } from "utils/common/colorPalette";
import { ModelTask } from "types/ModelType";
import { Model } from "utils/common/models/Model";
import { Segmenter } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";

export const SegmenterList = () => {
  const dispatch = useDispatch();

  const categories = useSelector(selectCreatedAnnotationCategories);
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
        model={selectedModel}
        modelStatus={modelStatus}
        onClose={onSaveSegmenterDialogClose}
        open={openSaveSegmenterDialog}
      />
    </>
  );
};
