import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  Box,
  Button,
  ButtonGroup,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";

import { useClassifierApi } from "core/dl/classification";

import { WithLabel, TextFieldWithBlur, StyledSelect } from "components/inputs";

import { classifierSlice } from "store/classifier";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";
import { HelpItem } from "help/HelpContent";

import { logger } from "utils/logUtils";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import {
  ErrorReason,
  useClassifierStatus,
} from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { TooltipWithDisable } from "@ProjectViewer/components";
import { useClassificationModel } from "@ProjectViewer/hooks";

import type { SelectChangeEvent } from "@mui/material";

import type { ModelArch, ModelInfoDTO } from "core/dl/classification/types";

export const ModelPicker = () => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const kindClassifierInfo = useParameterizedSelector(
    selectKindClassifier,
    modelTarget,
  );
  const activeModel = useClassificationModel();

  if (!kindClassifierInfo) return null;
  return (
    <Box
      sx={{
        py: 2,
      }}
    >
      <Typography gutterBottom align="left">
        {activeModel
          ? "Continue training, clone, or delete the selected model"
          : "Choose a model architecture and set the model hyperparameters."}
      </Typography>
      {activeModel ? (
        <PretrainedModelOptions activeModel={activeModel} />
      ) : (
        <ModelArchiitectureOptions
          targetId={kindClassifierInfo.modelTargetId}
          newModelArch={kindClassifierInfo.newModelArch}
        />
      )}
    </Box>
  );
};

const ModelArchiitectureOptions = ({
  targetId,
  newModelArch,
}: {
  targetId: string;
  newModelArch: ModelArch;
}) => {
  const dispatch = useDispatch();

  const { newModelName, setNewModelName, activeErrors } = useClassifierStatus();
  const [draft, setDraft] = useState<string | null>(null);

  const handleArchitectureChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as ModelArch;
    dispatch(
      classifierSlice.actions.setNewModelArch({
        targetId,
        modelArch: value,
      }),
    );
  };
  const handleNameChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;

    setDraft(value);
  };

  const handleConfirmName = () => {
    if (draft !== null) setNewModelName(draft);
    setDraft(null);
  };

  return (
    <Stack
      data-doc="model-picker"
      direction="row"
      spacing={2}
      sx={{
        py: 1,
        justifyContent: "space-evenly",
      }}
    >
      <WithLabel
        label="Model Architecture:"
        labelProps={{
          variant: "body2",
          sx: { mr: "1rem", whiteSpace: "nowrap" },
        }}
        data-help={HelpItem.ModelArchitecture}
      >
        <StyledSelect
          value={newModelArch}
          onChange={handleArchitectureChange}
          fullWidth
        >
          <MenuItem
            dense
            value={0}
            sx={{
              borderRadius: 0,
              minHeight: "1rem",
            }}
          >
            Simple CNN
          </MenuItem>
          <MenuItem dense value={1} sx={{ borderRadius: 0, minHeight: "1rem" }}>
            MobileNet
          </MenuItem>
        </StyledSelect>
      </WithLabel>
      <WithLabel
        label="Model Name:"
        labelProps={{
          variant: "body2",
          sx: { mr: "1rem", whiteSpace: "nowrap" },
        }}
      >
        <TextFieldWithBlur
          size="small"
          onChange={handleNameChange}
          value={draft ?? newModelName}
          fullWidth
          onBlur={handleConfirmName}
          error={activeErrors.some(
            (err) => err.reason === ErrorReason.DuplicateModelName,
          )}
          sx={(theme) => ({
            input: {
              py: 0.5,
              fontSize: theme.typography.body2.fontSize,
              minHeight: "1rem",
            },
          })}
        />
      </WithLabel>
    </Stack>
  );
};

const PretrainedModelOptions = ({
  activeModel,
}: {
  activeModel: ModelInfoDTO | undefined;
}) => {
  const dispatch = useDispatch();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const { shouldWarnClearPredictions } = useClassifierStatus();
  const cfApi = useClassifierApi();
  const handleDisposeModel = async () => {
    if (!activeModel) return;

    const result = await cfApi.removeModel(activeModel.name);
    if (result.success) {
      logger(`Successfully removed ${activeModel.name}`);
    } else {
      console.error(
        `[dispose model: ${activeModel.name}] ${result.reason.code}: ${result.reason.message}`,
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
        modelName: activeModel.name,
      }),
    );
  };
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        py: 1,
        px: 1,
        justifyContent: "space-between",
        alignContent: "center",
        alignItems: "center",
      }}
    >
      <Typography variant="body2" noWrap>
        {`Selected Model:  ${activeModel!.name}`}
      </Typography>
      <ButtonGroup sx={{ justifyContent: "space-evenly" }}>
        <TooltipWithDisable
          title={
            shouldWarnClearPredictions
              ? "Clear or accept predictions before clearing"
              : "Clear the current model"
          }
          placement="bottom"
        >
          <Button
            onClick={handleDisposeModel}
            disableFocusRipple
            color="primary"
            variant="text"
            sx={(theme) => ({
              py: 1,
              pl: 0,
              fontSize: theme.typography.caption.fontSize,
              backgroundColor: "transparent",
            })}
          >
            Delete Model
          </Button>
        </TooltipWithDisable>
        <TooltipWithDisable
          title={
            shouldWarnClearPredictions
              ? "Clear or accept predictions before clearing"
              : "Clear the current model"
          }
          placement="bottom"
        >
          <Button
            onClick={handleDisposeModel}
            disableFocusRipple
            color="primary"
            variant="text"
            sx={(theme) => ({
              p: 1,
              fontSize: theme.typography.caption.fontSize,
              backgroundColor: "transparent",
            })}
          >
            Clone Model
          </Button>
        </TooltipWithDisable>
      </ButtonGroup>
    </Stack>
  );
};
