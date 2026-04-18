import {
  Box,
  Button,
  ButtonGroup,
  MenuItem,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import { StyledSelect } from "components/inputs/StyledSelect";
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
import { TextFieldWithBlur } from "components/inputs/TextFieldWithBlur";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { WithLabel } from "components/inputs";

export const ModelPicker = () => {
  const selectedModel = useSelector(selectClassifierModel);

  return (
    <Box py={2}>
      <Typography gutterBottom align="left">
        {selectedModel
          ? "Continue training, clone, or delete the selected model"
          : "Choose a model architecture and set the model hyperparameters."}
      </Typography>
      {!selectedModel ? (
        <ModelArchiitectureOptions />
      ) : (
        <PretrainedModelOptions />
      )}
    </Box>
  );
};

const ModelArchiitectureOptions = () => {
  const dispatch = useDispatch();
  const modelNameOrArch = useSelector(selectClassifierModelNameOrArch);
  const selectedModel = useSelector(selectClassifierModel);
  const availableClassifierNames = useSelector(selectAvailibleClassifierNames);
  const activeKind = useSelector(selectActiveKindObject);
  const [userHasUpdated, setUsrHasUpdated] = useState(false);
  const { setNewModelName: setConfirmedName } = useClassifierStatus();
  const [modelName, setModelName] = useState("");

  const handleArchitectureChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as number;
    dispatch(
      classifierSlice.actions.updateSelectedModelNameOrArch({
        kindId: activeKind.id,
        modelName: value,
      }),
    );
  };
  const handleNameChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;
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
    <Stack direction="row" spacing={2} py={1} justifyContent="space-evenly">
      <WithLabel
        label="Model Architecture:"
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

const PretrainedModelOptions = () => {
  const modelNameOrArch = useSelector(selectClassifierModelNameOrArch);
  const { shouldWarnClearPredictions } = useClassifierStatus();
  const selectedModel = useSelector(selectClassifierModel);

  const handleDisposeModel = () => {
    if (!selectedModel) return;
    selectedModel.dispose();
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
        {`Selected Model:  ${selectedModel!.name}`}
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
            shouldWarnClearPredictions
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
