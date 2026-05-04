import { useEffect, useMemo } from "react";

import { useSelector } from "react-redux";

import { Grid2 as Grid } from "@mui/material";

import { selectTotalActiveLabeledItems } from "@ProjectViewer/state/reselectors";
import { selectActiveClassifierModelTarget } from "@ProjectViewer/state/selectors";
import { useParameterizedSelector } from "store/hooks";
import { selectKindClassifier } from "store/classifier/selectors";

import { logger } from "utils/logUtils";

import { OptimizationSettings } from "./OptimizationSettings";
import { TrainingStrategySettings } from "./TrainingStrategySettings";

export const ClassifierOptimizerSettings = () => {
  const labeledThingsCount = useSelector(selectTotalActiveLabeledItems);
  const modelTarget = useSelector(selectActiveClassifierModelTarget);
  const kindClassifier = useParameterizedSelector(
    selectKindClassifier,
    modelTarget.id,
  );
  const fitOptions = useMemo(() => {
    const modelName = kindClassifier.activeModel;
    if (!modelName)
      return kindClassifier.modelInfoDict["base-model"].optimizerSettings;
    return kindClassifier.modelInfoDict[modelName].optimizerSettings;
  }, [kindClassifier]);
  const trainingPercentage = useMemo(() => {
    const modelName = kindClassifier.activeModel;
    if (!modelName)
      return kindClassifier.modelInfoDict["base-model"].preprocessSettings
        .trainingPercentage;
    return kindClassifier.modelInfoDict[modelName].preprocessSettings
      .trainingPercentage;
  }, [kindClassifier]);

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
