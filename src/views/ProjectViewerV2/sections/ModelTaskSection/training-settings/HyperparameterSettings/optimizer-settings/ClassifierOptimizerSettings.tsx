import { Grid2 as Grid } from "@mui/material";

import { useEffect } from "react";
import { useSelector } from "react-redux";
import {
  selectClassifierFitOptions,
  selectClassifierTrainingPercentage,
} from "store/classifier/reselectors";
import { selectActiveLabeledThingsCount } from "store/project/reselectors";
import { logger } from "utils/logUtils";

import { OptimizationSettings } from "./OptimizationSettings";
import { TrainingStrategySettings } from "./TrainingStrategySettings";

export const ClassifierOptimizerSettings = () => {
  const trainingPercentage = useSelector(selectClassifierTrainingPercentage);
  const labeledThingsCount = useSelector(selectActiveLabeledThingsCount);
  const fitOptions = useSelector(selectClassifierFitOptions);

  useEffect(() => {
    if (
      import.meta.env.NODE_ENV !== "production" &&
      import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
      labeledThingsCount > 0
    ) {
      const trainingSize = Math.round(labeledThingsCount * trainingPercentage);
      const validationSize = labeledThingsCount - trainingSize;

      logger(
        `Set training size to Round[${labeledThingsCount} * ${trainingPercentage}] = ${trainingSize}
        ; val size to ${labeledThingsCount} - ${trainingSize} = ${validationSize}`,
      );

      logger(
        `Set training batches per epoch to RoundUp[${trainingSize} / ${
          fitOptions.batchSize
        }] = ${Math.ceil(trainingSize / fitOptions.batchSize)}`,
      );

      logger(
        `Set validation batches per epoch to RoundUp[${validationSize} / ${
          fitOptions.batchSize
        }] = ${Math.ceil(validationSize / fitOptions.batchSize)}`,
      );

      logger(
        `Training last batch size is ${trainingSize % fitOptions.batchSize}
        ; validation is ${validationSize % fitOptions.batchSize}`,
      );
    }
  }, [fitOptions.batchSize, trainingPercentage, labeledThingsCount]);

  return (
    <Grid container spacing={2} padding={2}>
      <TrainingStrategySettings />
      <OptimizationSettings />
    </Grid>
  );
};
