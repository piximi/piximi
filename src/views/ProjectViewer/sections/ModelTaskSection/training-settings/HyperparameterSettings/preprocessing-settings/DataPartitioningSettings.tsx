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
  selectClassifierShuffleOptions,
  selectClassifierTrainingPercentage,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { TextFieldWithBlur } from "views/ProjectViewer/components/TextFieldWithBlur";
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

  const trainingFieldValidationOptions = useMemo(
    () => ({ min: 0.1, max: 0.99, enableFloat: true }),
    [],
  );
  const {
    inputValue: trainPercInput,
    handleOnChangeValidation: handleTrainPercInputChange,
    error: trainPercInputError,
  } = useNumberField(trainingPercentage, trainingFieldValidationOptions);
  const dispatchTrainingPercentage = () => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { trainingPercentage: trainPercInput },
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
          <TextFieldWithBlur
            size="small"
            onChange={handleTrainPercInputChange}
            value={trainPercInput}
            fullWidth
            onBlur={dispatchTrainingPercentage}
            disabled={!trainable}
            sx={(theme) => ({
              width: "15ch",
              input: {
                py: 0.5,
                fontSize: theme.typography.body2.fontSize,
                minHeight: "1rem",
              },
            })}
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
            />
          </FormControl>
        </Collapse>
      </Stack>
    </Grid>
  );
};
