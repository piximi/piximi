import { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import {
  Box,
  Button,
  ButtonGroup,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";

import { WithLabel, TextFieldWithBlur, StyledSelect } from "components/inputs";

import { useClassificationModel } from "@ProjectViewer/hooks";
import { TooltipWithDisable } from "@ProjectViewer/components";
import { classifierSlice } from "store/classifier";
import {
  ErrorReason,
  useClassifierStatus,
} from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import {
  selectAllCreatedModelNames,
  selectKindClassifier,
} from "store/classifier/selectors";
import { useClassifierApi } from "core/dl/classification";

import { findReplicateName } from "utils/stringUtils";
import { logger } from "utils/logUtils";

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
    <Box py={2}>
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
          modelTargetName={kindClassifierInfo.modelTargetName}
        />
      )}
    </Box>
  );
};

const ModelArchiitectureOptions = ({
  targetId,
  newModelArch,
  modelTargetName,
}: {
  targetId: string;
  newModelArch: ModelArch;
  modelTargetName: string;
}) => {
  const dispatch = useDispatch();
  const restrictedClassifierNames = useSelector(selectAllCreatedModelNames);

  const [userHasUpdated, setUserHasUpdated] = useState(false);
  const { setNewModelName: setConfirmedName, activeErrors } =
    useClassifierStatus();
  const [modelName, setModelName] = useState("");

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

    if (!userHasUpdated) setUserHasUpdated(true);
    setModelName(value);
  };

  const handleConfirmName = () => {
    setConfirmedName(modelName);
  };

  useEffect(() => {
    if (userHasUpdated) return;
    const candidateName = `${modelTargetName}_${newModelArch === 0 ? "Simple-CNN" : "Mobilenet"}`;

    const replicates = findReplicateName(
      candidateName,
      restrictedClassifierNames,
    );

    if (!replicates) {
      setModelName(candidateName);
      setConfirmedName(candidateName);
      return;
    }
    setModelName(candidateName + replicates.length);
    setConfirmedName(candidateName + replicates.length);
  }, [userHasUpdated, restrictedClassifierNames, newModelArch]);

  return (
    <Stack direction="row" spacing={2} py={1} justifyContent="space-evenly">
      <WithLabel
        label="Model Architecture:"
        labelProps={{
          variant: "body2",
          sx: { mr: "1rem", whiteSpace: "nowrap" },
        }}
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
          value={modelName}
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
      py={1}
      px={1}
      justifyContent="space-between"
      alignContent="center"
      alignItems="center"
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
