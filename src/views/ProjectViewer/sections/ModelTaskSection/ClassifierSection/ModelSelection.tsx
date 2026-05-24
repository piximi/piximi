import { batch, useDispatch, useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import { MenuItem, IconButton, Stack } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

import { WithLabel, StyledSelect } from "components/inputs";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { classifierSlice } from "store/classifier";
import { selectKindModelNames } from "store/classifier/selectors";
import { useParameterizedSelector } from "store/hooks";

import { ClassifierApi } from "utils/dl/classification";
import type { ModelInfoDTO } from "utils/dl/classification/types";
import { ModelArch } from "utils/dl/classification/types";
import { logger } from "utils/logUtils";

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
    const cfApi = ClassifierApi.getInstance();
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
      direction="row"
      width="100%"
      sx={(theme) => ({
        width: "100%",
        justifyContent: "space-between",
        py: 1.5,
        px: 0.5,
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      })}
    >
      <WithLabel
        label="Model:"
        labelProps={{
          variant: "body2",
          sx: {
            mr: "0.5rem",
            whiteSpace: "nowrap",
          },
        }}
        sx={{ maxWidth: "calc(100% - 23px)" }}
      >
        <StyledSelect
          value={selectedModelName}
          onChange={handleModelChange}
          fullWidth
          variant="standard"
          disabled={kindModelNames.length === 0}
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
      </WithLabel>
      <TooltipWithDisable title={"Delete the current model"} placement="bottom">
        <IconButton
          size="small"
          sx={{ pr: 0 }}
          onClick={handleDisposeModel}
          disabled={!selectedModelConfig}
        >
          <DeleteIcon sx={{ fontSize: "1.15rem" }} />
        </IconButton>
      </TooltipWithDisable>
    </Stack>
  );
};
