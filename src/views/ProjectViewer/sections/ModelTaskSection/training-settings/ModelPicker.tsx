import { useEffect, useMemo, useState } from "react";

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

import { StyledSelect } from "components/inputs/StyledSelect";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";
import { TextFieldWithBlur } from "components/inputs/TextFieldWithBlur";
import { WithLabel } from "components/inputs";

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
import type { ModelArch } from "store/classifier/types";

import classifierHandler from "utils/dl/classification/classifierHandler";
import type { SequentialClassifier } from "utils/dl/classification";
import { findReplicateName } from "utils/stringUtils";

export const ModelPicker = () => {
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const kindClassifierInfo = useParameterizedSelector(
    selectKindClassifier,
    modelTarget,
  );

  const activeModel = useMemo(
    () =>
      kindClassifierInfo?.activeModel
        ? classifierHandler.getModel(kindClassifierInfo.activeModel)
        : undefined,
    [kindClassifierInfo?.activeModel],
  );
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
          kindId={kindClassifierInfo.kindId}
          newModelArch={kindClassifierInfo.newModelArch}
          modelTargetName={kindClassifierInfo.modelTargetName}
        />
      )}
    </Box>
  );
};

const ModelArchiitectureOptions = ({
  kindId,
  newModelArch,
  modelTargetName,
}: {
  kindId: string;
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
        kindId: kindId,
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
  activeModel: SequentialClassifier;
}) => {
  const { shouldWarnClearPredictions } = useClassifierStatus();

  const handleDisposeModel = () => {
    activeModel.dispose();
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
