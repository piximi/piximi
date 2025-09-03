import { Grid2 as Grid } from "@mui/material";

import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  selectClassifierFitOptions,
  selectClassifierTrainingPercentage,
} from "store/classifier/reselectors";
import { logger } from "utils/logUtils";

import { OptimizationSettings } from "./OptimizationSettings";
import { TrainingStrategySettings } from "./TrainingStrategySettings";
import { selectActiveKindItemArray } from "store/project/reselectors";
import { isUnknownCategory } from "store/data/utils";

export const ClassifierOptimizerSettings = () => {
  const trainingPercentage = useSelector(selectClassifierTrainingPercentage);
  const activeKindItems = useSelector(selectActiveKindItemArray);
  const fitOptions = useSelector(selectClassifierFitOptions);

  const labeledKindItems = useMemo(
    () =>
      activeKindItems.filter(
        (kindItem) => !isUnknownCategory(kindItem.categoryId),
      ),
    [activeKindItems],
  );

  const labeledItemCount = useMemo(
    () => labeledKindItems.length,
    [labeledKindItems],
  );

  useEffect(() => {
    if (
      import.meta.env.NODE_ENV !== "production" &&
      import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
      labeledItemCount > 0
    ) {
      const trainingSize = Math.round(labeledItemCount * trainingPercentage);
      const validationSize = labeledItemCount - trainingSize;

      logger(
        `Set training size to Round[${labeledItemCount} * ${trainingPercentage}] = ${trainingSize}
        ; val size to ${labeledItemCount} - ${trainingSize} = ${validationSize}`,
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
  }, [fitOptions.batchSize, trainingPercentage, labeledItemCount]);

  return (
    <Grid container spacing={2} padding={2}>
      <TrainingStrategySettings />
      <OptimizationSettings />
    </Grid>
  );
};
