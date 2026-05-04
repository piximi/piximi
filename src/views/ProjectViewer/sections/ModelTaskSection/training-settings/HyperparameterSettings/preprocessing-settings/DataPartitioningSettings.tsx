import { useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

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

import { useNumberField } from "hooks";

import { FunctionalDivider } from "components/ui";
import { WithLabel } from "components/inputs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { classifierSlice } from "store/classifier";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";

import classifierHandler from "utils/dl/classification/classifierHandler";

import { ModelSettingsTextField } from "../../../ModelSettingsTextField";

export const DataPartitioningSettings = () => {
  const dispatch = useDispatch();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { trainable } = useClassifierStatus();
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget.id,
  );
  const model = useMemo(() => {
    if (!kindClassifier || !kindClassifier.activeModel) return;
    return classifierHandler.getModel(kindClassifier.activeModel);
  }, [kindClassifier?.activeModel]);
  const shuffleOptions = useMemo(() => {
    const modelName = kindClassifier.activeModel;
    if (!modelName)
      return kindClassifier.modelInfoDict["base-model"].preprocessSettings
        .shuffle;
    return kindClassifier.modelInfoDict[modelName].preprocessSettings.shuffle;
  }, [kindClassifier]);
  const trainingPercentage = useMemo(() => {
    const modelName = kindClassifier.activeModel;
    if (!modelName)
      return kindClassifier.modelInfoDict["base-model"].preprocessSettings
        .trainingPercentage;
    return kindClassifier.modelInfoDict[modelName].preprocessSettings
      .trainingPercentage;
  }, [kindClassifier]);

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
        kindId: modelTarget.id,
      }),
    );
  };

  const toggleShuffleOptions = () => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { shuffle: shuffleOptions },
        kindId: modelTarget.id,
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
          data-help={HelpItem.TrainPercentage}
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
            disabled={!!model || !trainable}
          />
        </WithLabel>
        <Collapse in={showAdvanced}>
          <FormControl size="small">
            <FormControlLabel
              data-help={HelpItem.DataShuffling}
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
              disabled={!!model}
            />
          </FormControl>
        </Collapse>
      </Stack>
    </Grid>
  );
};
