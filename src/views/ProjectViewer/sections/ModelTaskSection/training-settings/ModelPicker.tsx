import {
  Box,
  Button,
  ButtonGroup,
  Grid2 as Grid,
  MenuItem,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import { StyledSelect } from "../../../components/StyledSelect";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "store/classifier";
import {
  selectAvailibleClassifierNames,
  selectClassifierModel,
  selectClassifierModelNameOrArch,
} from "store/classifier/reselectors";
import { selectActiveKindObject } from "store/project/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { availableClassificationModels } from "utils/models/availableClassificationModels";
import { ModelStatus } from "utils/models/enums";
import { TextFieldWithBlur } from "views/ProjectViewer/components/TextFieldWithBlur";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { WithLabel } from "views/ProjectViewer/components/WithLabel";

export const ModelPicker = () => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const modelNameOrArch = useSelector(selectClassifierModelNameOrArch);
  const handleModelTypeChange = (nameOrArch: number | string) => {
    console.log("modelArchitectureChange: ", nameOrArch); //LOG:
    dispatch(
      classifierSlice.actions.updateSelectedModelNameOrArch({
        kindId: activeKindId,
        modelName: nameOrArch,
      })
    );
  };

  return (
    <Box py={2}>
      <Typography gutterBottom align="left">
        Train a new model with selected architecture or continue training an
        existing model
      </Typography>
      <Grid container spacing={2} p={2}>
        <Grid size={6}>
          <ModelArchiitectureOptions
            modelNameOrArch={modelNameOrArch}
            onArchitectureChange={handleModelTypeChange}
          />
        </Grid>
        <Grid size={6}>
          <PretrainedModelOptions
            modelNameOrArch={modelNameOrArch}
            onModelChange={handleModelTypeChange}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

const ModelArchiitectureOptions = ({
  modelNameOrArch,
  onArchitectureChange,
}: {
  modelNameOrArch: string | number;
  onArchitectureChange: (arch: number) => void;
}) => {
  const selectedModel = useSelector(selectClassifierModel);
  const availableClassifierNames = useSelector(selectAvailibleClassifierNames);
  const activeKind = useSelector(selectActiveKindObject);
  const [userHasUpdated, setUsrHasUpdated] = useState(false);
  const { setNewModelName: setConfirmedName } = useClassifierStatus();
  const [modelName, setModelName] = useState("");

  const handleArchitectureChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as number;
    onArchitectureChange(value);
  };
  const handleNameChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    console.log("onChange value: ", value);
    if (!userHasUpdated) setUsrHasUpdated(true);
    setModelName(value);
  };

  const handleConfirmName = () => {
    setConfirmedName(modelName);
  };

  useEffect(() => {
    if (userHasUpdated || !!selectedModel) return;
    const candidateName = `${activeKind.displayName}_${modelNameOrArch === 0 ? "Simple-CNN" : "Mobilenet"}`;
    const availabbleNames = availableClassifierNames.join(", ");
    const replicates = availabbleNames.match(new RegExp(candidateName, "g"));

    if (!replicates) {
      setModelName(candidateName);
      setConfirmedName(candidateName);
      return;
    }
    setModelName(candidateName + replicates.length);
    setConfirmedName(candidateName + replicates.length);
  }, [
    userHasUpdated,
    availableClassifierNames,
    selectedModel,
    modelNameOrArch,
  ]);

  return (
    <Stack width="80%" spacing={2}>
      <WithLabel
        label="New Model Architecture:"
        labelProps={{
          variant: "body2",
          sx: { mr: "1rem", whiteSpace: "nowrap" },
        }}
      >
        <StyledSelect
          value={typeof modelNameOrArch === "number" ? modelNameOrArch : ""}
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
          disabled={typeof modelNameOrArch === "string"}
          onBlur={handleConfirmName}
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
  modelNameOrArch,
  onModelChange,
}: {
  modelNameOrArch: string | number;
  onModelChange: (modelName: string) => void;
}) => {
  const { shouldClearPredictions, isReady } = useClassifierStatus();
  const dispatch = useDispatch();
  const selectedModel = useSelector(selectClassifierModel);
  const activeKindId = useSelector(selectActiveKindId);
  const handleModelChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as string;
    onModelChange(value);
  };
  const handleDisposeModel = () => {
    if (!selectedModel) return;
    selectedModel.dispose();
    dispatch(
      classifierSlice.actions.updateModelStatus({
        kindId: activeKindId,
        modelStatus: ModelStatus.Uninitialized,
        nameOrArch: selectedModel.name,
      })
    );
  };
  return (
    <Stack spacing={2} width="80%">
      <WithLabel
        label="Pre-Trained Model:"
        labelProps={{
          variant: "body2",
          sx: { mr: "1rem", whiteSpace: "nowrap" },
        }}
      >
        <StyledSelect
          value={typeof modelNameOrArch === "string" ? modelNameOrArch : ""}
          onChange={handleModelChange}
          fullWidth
        >
          {Object.keys(availableClassificationModels).map((modelName, idx) => (
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
      <ButtonGroup sx={{ width: "100%", justifyContent: "space-evenly" }}>
        <TooltipWithDisable
          title={
            shouldClearPredictions
              ? "Clear or accept predictions before clearing"
              : "Clear the current model"
          }
          placement="bottom"
        >
          <Button
            onClick={handleDisposeModel}
            disableFocusRipple
            disabled={typeof modelNameOrArch === "number"}
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
            shouldClearPredictions
              ? "Clear or accept predictions before clearing"
              : "Clear the current model"
          }
          placement="bottom"
        >
          <Button
            onClick={handleDisposeModel}
            disableFocusRipple
            disabled={typeof modelNameOrArch === "number"}
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
