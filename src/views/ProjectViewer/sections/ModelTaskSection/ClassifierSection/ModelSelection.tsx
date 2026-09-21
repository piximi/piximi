import { batch, useDispatch, useSelector } from "react-redux";

import { MenuItem, IconButton, Stack, Box, Typography } from "@mui/material";
import {
  Delete as DeleteIcon,
  SaveAlt as SaveIcon,
  Add as AddIcon,
} from "@mui/icons-material";

import { useClassifierApi } from "core/dl/classification";
import { ModelArch } from "core/dl/classification/types";

import { useDialog, useDialogHotkey } from "hooks";

import { StyledSelect } from "components/inputs";

import { classifierSlice } from "store/classifier";
import { selectKindModelNames } from "store/classifier/selectors";
import { useParameterizedSelector } from "store/hooks";

import { logger } from "utils/logUtils";
import { HotkeyContext } from "utils/enums";

import { HelpItem } from "data/help/HelpContent";

import { SaveFittedModelDialog } from "views/ProjectViewer/components/dialogs";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import {
  TooltipTextButton,
  TooltipWithDisable,
} from "@ProjectViewer/components";

import { ImportTensorflowClassificationModelDialog } from "../ImportTensorflowModelDialog";

import type { SelectChangeEvent } from "@mui/material";

import type { ModelInfoDTO } from "core/dl/classification/types";

export const ModelSelection = ({
  selectedModelConfig,
}: {
  selectedModelConfig: ModelInfoDTO | undefined;
}) => {
  const dispatch = useDispatch();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const selectedModelName = selectedModelConfig?.name ?? "new";
  const kindModelNames = useParameterizedSelector(
    selectKindModelNames,
    modelTarget,
  );
  const cfApi = useClassifierApi();
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
    const value: string | ModelArch = event.target.value as string;
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
            modelArch: ModelArch.SIMPLE_CNN,
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
  const handleDisposeModel = async () => {
    if (!selectedModelConfig) return;
    const result = await cfApi.removeModel(selectedModelConfig.name);
    if (result.success) {
      logger(`Successfully removed ${selectedModelConfig.name}`);
    } else {
      console.error(
        `[dispose model: ${selectedModelConfig.name}] ${result.reason.code}: ${result.reason.message}`,
        result.reason.cause,
      );
    }
    /*
     * Even if dispose fails in the worker, still want to remove model as an option for selection
     * TODO: Determine if this is the best course of action
     * */
    dispatch(
      classifierSlice.actions.setActiveModel({
        targetId: modelTarget,
        modelName: undefined,
      }),
    );
    dispatch(
      classifierSlice.actions.removeModelInfo({
        modelName: selectedModelConfig.name,
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
        color="text.secondary"
        sx={{ display: "block", lineHeight: 1.6 }}
      >
        Model I/O
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <TooltipTextButton
          dataHelp={HelpItem.LoadClassificationModel}
          icon={<AddIcon />}
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
          icon={<SaveIcon />}
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
        color="text.secondary"
        sx={{ display: "block", lineHeight: 1.6 }}
      >
        Selected Model
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
          pl: 1,
        }}
      >
        <StyledSelect
          value={selectedModelName}
          onChange={handleModelChange}
          variant="standard"
          disabled={kindModelNames.length === 0}
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
          {kindModelNames.map((modelName, idx) => (
            <MenuItem
              key={modelName + idx}
              dense
              value={modelName}
              sx={{
                borderRadius: 0,
                minHeight: "1rem",
              }}
            >
              {modelName}
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
