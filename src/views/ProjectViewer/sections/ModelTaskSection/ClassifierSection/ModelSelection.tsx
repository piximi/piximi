import { batch, useDispatch, useSelector } from "react-redux";

import { MenuItem, IconButton, Stack, Box, Typography } from "@mui/material";
import {
  Delete as DeleteIcon,
  SaveAlt as SaveIcon,
  Add as AddIcon,
} from "@mui/icons-material";

import { useBackend } from "core/backend";
import { ARCHITECTURE_IDS, ModelArch } from "core/dl/classification/types";

import { useDialog, useDialogHotkey } from "hooks";

import { StyledSelect, TooltipTextButton } from "components/inputs";

import { classifierSlice } from "store/classifier";
import { selectKindClassifiers } from "store/classifier/selectors";
import { useParameterizedSelector } from "store/hooks";
import { HelpItem } from "help/HelpContent";

import { HotkeyContext } from "utils/enums";

import { SaveFittedModelDialog } from "views/ProjectViewer/components/dialogs";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { TooltipWithDisable } from "@ProjectViewer/components";

import { ImportTensorflowClassificationModelDialog } from "../ImportTensorflowModelDialog";

import type { SelectChangeEvent } from "@mui/material";

import type { Classifier } from "core/dl/classification/types";

export const ModelSelection = ({
  selectedModelConfig,
}: {
  selectedModelConfig: Classifier | undefined;
}) => {
  const dispatch = useDispatch();
  const backend = useBackend();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const selectedModelId = selectedModelConfig?.id ?? "new";
  const kindClassifiers = useParameterizedSelector(
    selectKindClassifiers,
    modelTarget,
  );
  const {
    onClose: handleCloseImportClassifierDialog,
    onOpen: handleOpenImportClassifierDialog,
    open: ImportClassifierDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);
  const {
    onClose: handleCloseSaveClassifierDialog,
    onOpen: handleOpenSaveClassifierDialog,
    open: SaveClassifierDialogOpen,
  } = useDialog();
  const handleModelChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as string;
    if (value === "new") {
      batch(() => {
        dispatch(
          classifierSlice.actions.setActiveModel({
            targetId: modelTarget,
            modelName: undefined,
          }),
        );
        dispatch(
          classifierSlice.actions.setNewModelArch({
            targetId: modelTarget,
            modelArch: ARCHITECTURE_IDS[ModelArch.SIMPLE_CNN],
          }),
        );
      });
    } else {
      dispatch(
        classifierSlice.actions.setActiveModel({
          targetId: modelTarget,
          modelName: value,
        }),
      );
    }
  };
  // The backend drops the record and announces it; the slice follows.
  const handleDisposeModel = async () => {
    if (!selectedModelConfig || !backend.classification) return;
    try {
      await backend.classification.delete(selectedModelConfig.id);
    } catch (error) {
      console.error(`[dispose model: ${selectedModelConfig.name}]`, error);
    }
    dispatch(
      classifierSlice.actions.setActiveModel({
        targetId: modelTarget,
        modelName: undefined,
      }),
    );
  };
  return (
    <Stack
      sx={{
        width: "100%",
        gap: 0.5,
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: "text.secondary",
          display: "block",
          lineHeight: 1.6,
        }}
      >
        Model I/O
      </Typography>
      <Box
        data-doc="model-io"
        sx={{ display: "flex", justifyContent: "space-between" }}
      >
        <TooltipTextButton
          dataHelp={HelpItem.LoadClassificationModel}
          startIcon={<AddIcon />}
          label="Load Model"
          tooltipText="Load a saved or remote model"
          onClick={handleOpenImportClassifierDialog}
          sx={{
            font: "var(--mui-font-caption)",
            color: "var(--mui-palette-primary-main)",
          }}
        />
        <TooltipTextButton
          dataHelp={HelpItem.SaveClassificationModel}
          startIcon={<SaveIcon />}
          label="Save Model"
          tooltipText={
            selectedModelConfig
              ? "Save the trained model"
              : "Select or train a model to save"
          }
          onClick={handleOpenSaveClassifierDialog}
          disabled={!selectedModelConfig}
          sx={{
            font: "var(--mui-font-caption)",
            color: "var(--mui-palette-primary-main)",
          }}
        />
      </Box>
      <Typography
        variant="overline"
        sx={{
          color: "text.secondary",
          display: "block",
          lineHeight: 1.6,
        }}
      >
        Selected Model
      </Typography>
      <Box
        data-doc="model-select"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          pl: 1,
        }}
      >
        <StyledSelect
          value={selectedModelId}
          onChange={handleModelChange}
          variant="standard"
          disabled={kindClassifiers.length === 0}
          data-help={HelpItem.ClassificationModelSelect}
        >
          <MenuItem
            dense
            value="new"
            sx={{
              borderRadius: 0,
              minHeight: "1rem",
            }}
          >
            New Model
          </MenuItem>
          {kindClassifiers.map((classifier) => (
            <MenuItem
              key={classifier.id}
              dense
              value={classifier.id}
              sx={{
                borderRadius: 0,
                minHeight: "1rem",
              }}
            >
              {classifier.name}
            </MenuItem>
          ))}
        </StyledSelect>
        <TooltipWithDisable
          title={"Delete the current model"}
          placement="bottom"
        >
          <IconButton
            size="small"
            sx={{ pr: 0 }}
            onClick={handleDisposeModel}
            disabled={!selectedModelConfig}
            data-help={HelpItem.DeleteModel}
          >
            <DeleteIcon sx={{ fontSize: "1.15rem" }} />
          </IconButton>
        </TooltipWithDisable>
      </Box>
      <ImportTensorflowClassificationModelDialog
        onClose={handleCloseImportClassifierDialog}
        open={ImportClassifierDialogOpen}
      />
      {selectedModelConfig && (
        <SaveFittedModelDialog
          model={selectedModelConfig}
          onClose={handleCloseSaveClassifierDialog}
          open={SaveClassifierDialogOpen}
        />
      )}
    </Stack>
  );
};
