import { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";

import { useBackend } from "core/backend";

import { WithLabel, TextFieldWithBlur, StyledSelect } from "components/inputs";

import { classifierSlice } from "store/classifier";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";
import { HelpItem } from "help/HelpContent";

import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import {
  ErrorReason,
  useClassifierStatus,
} from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { TooltipWithDisable } from "@ProjectViewer/components";
import {
  useClassificationModel,
  useClassifierArchitectures,
} from "@ProjectViewer/hooks";

import type { ChipProps, SelectChangeEvent } from "@mui/material";

import type { ModelStatus } from "core/backend";
import type { Classifier } from "core/dl/classification/types";

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
        <ModelArchitectureOptions
          targetId={kindClassifierInfo.modelTargetId}
          newModelArch={kindClassifierInfo.newModelArch}
        />
      )}
    </Box>
  );
};

const statusChip: Record<
  ModelStatus,
  { label: string; color: ChipProps["color"] }
> = {
  unavailable: { label: "Not built", color: "default" },
  building: { label: "Building", color: "info" },
  ready: { label: "Ready", color: "success" },
  loaded: { label: "Loaded", color: "success" },
  failed: { label: "Failed", color: "error" },
};

/*
 * The architecture a new classifier is built from, as the backend lists
 * them. One that runs in its own environment may not be built yet; fitting
 * builds it, with the build's phases in the task toast.
 */
const ModelArchitectureOptions = ({
  targetId,
  newModelArch,
}: {
  targetId: string;
  newModelArch: string;
}) => {
  const dispatch = useDispatch();
  const architectures = useClassifierArchitectures();
  const { newModelName, setNewModelName, activeErrors } = useClassifierStatus();
  const [draft, setDraft] = useState<string | null>(null);

  const known = architectures.some((model) => model.name === newModelArch);
  const selected = architectures.find((model) => model.name === newModelArch);
  // The slice remembers an id from the last session; this backend may not
  // list it, so fall back to its first architecture.
  useEffect(() => {
    if (known || architectures.length === 0) return;
    dispatch(
      classifierSlice.actions.setNewModelArch({
        targetId,
        modelArch: architectures[0].name,
      }),
    );
  }, [known, architectures, dispatch, targetId]);

  const handleArchitectureChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as string;
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
    <Stack data-doc="model-picker" spacing={1} sx={{ py: 1 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-evenly" }}
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
            value={known ? newModelArch : ""}
            onChange={handleArchitectureChange}
            fullWidth
            disabled={architectures.length === 0}
          >
            {architectures.map((model) => (
              <MenuItem
                key={model.name}
                dense
                value={model.name}
                sx={{ borderRadius: 0, minHeight: "1rem" }}
              >
                {model.displayName}
              </MenuItem>
            ))}
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
      {selected && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", px: 1, maxWidth: "100%" }}
        >
          <Chip
            size="small"
            variant="outlined"
            color={statusChip[selected.status].color}
            label={statusChip[selected.status].label}
            icon={
              selected.status === "building" ? (
                <CircularProgress size={12} color="inherit" />
              ) : undefined
            }
          />
          <Typography variant="caption" color="textSecondary">
            {selected.version
              ? `${selected.framework} ${selected.version}`
              : selected.framework}
          </Typography>
          {selected.statusMessage && (
            <Typography
              variant="caption"
              color={selected.status === "failed" ? "error" : "textSecondary"}
              sx={{ overflowWrap: "anywhere" }}
            >
              {selected.statusMessage}
            </Typography>
          )}
          {selected.status === "unavailable" && (
            <Typography variant="caption" color="textSecondary">
              Fitting builds the environment first.
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
};

const PretrainedModelOptions = ({
  activeModel,
}: {
  activeModel: Classifier | undefined;
}) => {
  const dispatch = useDispatch();
  const backend = useBackend();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const { shouldWarnClearPredictions } = useClassifierStatus();
  const handleDisposeModel = async () => {
    if (!activeModel || !backend.classification) return;
    try {
      await backend.classification.delete(activeModel.id);
    } catch (error) {
      console.error(`[dispose model: ${activeModel.name}]`, error);
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
