import { useMemo, useState } from "react";

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

import { useClassificationModel, useNumberField } from "hooks";

import { FunctionalDivider } from "components/ui";
import { WithLabel } from "components/inputs";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { ModelSettingsTextField } from "../../ModelSettingsTextField";

export const DataPartitioningSettings = () => {
  const modelConfig = useClassificationModel();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const { trainable, handleUpdatePreprocessSettings, modelParams } =
    useClassifierStatus();

  const shuffleOptions = useMemo(() => {
    return modelParams.preprocessSettings.shuffle;
  }, [modelParams]);
  const trainingPercentage = useMemo(() => {
    return modelParams.preprocessSettings.trainingPercentage;
  }, [modelParams]);

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
    handleUpdatePreprocessSettings({ trainingPercentage: trainPercent });
  };

  const toggleShuffleOptions = () => {
    handleUpdatePreprocessSettings({ shuffle: !shuffleOptions });
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
            disabled={!!modelConfig || !trainable}
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
              disabled={!!modelConfig}
            />
          </FormControl>
        </Collapse>
      </Stack>
    </Grid>
  );
};
