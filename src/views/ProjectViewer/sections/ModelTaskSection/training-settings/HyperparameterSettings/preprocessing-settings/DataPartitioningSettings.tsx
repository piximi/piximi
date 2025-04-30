import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  Grid2 as Grid,
  IconButton,
  Stack,
} from "@mui/material";
import { FunctionalDivider } from "components/ui";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "store/classifier";
import {
  selectClassifierModel,
  selectClassifierShuffleOptions,
  selectClassifierTrainingPercentage,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { ModelSettingsTextField } from "views/ProjectViewer/components/ModelSettingsTextField";
import { WithLabel } from "views/ProjectViewer/components/WithLabel";
import { useClassifierStatus } from "views/ProjectViewer/contexts/ClassifierStatusProvider";
import { useNumberField } from "views/ProjectViewer/hooks/useNumberField";

export const DataPartitioningSettings = () => {
  const dispatch = useDispatch();
  const trainingPercentage = useSelector(selectClassifierTrainingPercentage);
  const activeKindId = useSelector(selectActiveKindId);
  const shuffleOptions = useSelector(selectClassifierShuffleOptions);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { trainable } = useClassifierStatus();
  const selectedModel = useSelector(selectClassifierModel);

  const trainingFieldValidationOptions = useMemo(
    () => ({ min: 0.1, max: 0.99, enableFloat: true }),
    [],
  );
  const {
    inputValue: trainPercent,
    inputString: trainPercentDisplay,
    setLastValidInput: setLastValidTrainPercent,
    resetInputValue: resetTrainPercent,
    handleOnChangeValidation: handleTrainPercentChange,
    error: trainPercentError,
  } = useNumberField(trainingPercentage, trainingFieldValidationOptions);
  const dispatchTrainingPercentage = () => {
    if (trainPercentError.error) {
      resetTrainPercent();
      return;
    }
    if (trainPercent === trainingPercentage) return;
    setLastValidTrainPercent(trainPercent);
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { trainingPercentage: trainPercent },
        kindId: activeKindId,
      }),
    );
  };

  const toggleShuffleOptions = () => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { shuffle: shuffleOptions },
        kindId: activeKindId,
      }),
    );
  };
  return (
    <Grid size={12}>
      <FunctionalDivider
        headerText="Data Partitioning"
        typographyVariant="body2"
        actions={
          <IconButton
            size="small"
            onClick={() => setShowAdvanced((showAdvanced) => !showAdvanced)}
          >
            {showAdvanced ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        }
      />
      <Stack sx={{ pl: 2 }}>
        <WithLabel
          label="Training Percentage:"
          labelProps={{
            variant: "body2",
            sx: { mr: "1rem", whiteSpace: "nowrap" },
          }}
        >
          <ModelSettingsTextField
            size="small"
            onChange={handleTrainPercentChange}
            value={trainPercentDisplay}
            fullWidth
            onBlur={dispatchTrainingPercentage}
            disabled={!!selectedModel || !trainable}
          />
        </WithLabel>
        <Collapse in={showAdvanced}>
          <FormControl size="small">
            <FormControlLabel
              sx={(theme) => ({
                fontSize: theme.typography.body2.fontSize,
                width: "max-content",
                ml: 0,
              })}
              control={
                <Checkbox
                  checked={shuffleOptions}
                  onChange={toggleShuffleOptions}
                  color="primary"
                  disabled={!trainable}
                />
              }
              label="Shuffle on Split"
              labelPlacement="start"
              disableTypography
              disabled={!!selectedModel}
            />
          </FormControl>
        </Collapse>
      </Stack>
    </Grid>
  );
};
