import React, { useState } from "react";
import { ModelPicker } from "./ModelPicker";
import { Grid2 as Grid, Typography } from "@mui/material";
import { ClassifierPreprocessingSettings } from "./ClassifierPreprocessingSettings";
import { ClassifierOptimizerSettings } from "./ClassifierOptimizerSettings";
import ExportHyperparametersButton from "./ExportHyperparametersButton";

const TrainingSettings = ({
  newModelArchitecture,
  setNewModelArchitecture,
  trainable,
}: {
  newModelArchitecture: string | number;
  setNewModelArchitecture: React.Dispatch<
    React.SetStateAction<string | number>
  >;
  trainable: boolean;
}) => {
  const [trainingType, setTrainingType] = useState<"new" | "existing">("new");

  return (
    <div>
      <ModelPicker
        trainingType={trainingType}
        setTrainingType={setTrainingType}
        archOrName={newModelArchitecture}
        setArchOrName={setNewModelArchitecture}
      ></ModelPicker>
      <Grid container columnSpacing={1}>
        <Grid size={6} pl={2}>
          <Typography>Data Preprocessing Settings</Typography>
        </Grid>
        <Grid size={6} pl={2}>
          <Typography>Optimization Settings</Typography>
        </Grid>
        <Grid
          size={6}
          sx={(theme) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
          })}
        >
          <ClassifierPreprocessingSettings trainable={trainable} />
        </Grid>
        <Grid
          size={6}
          sx={(theme) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: theme.shape.borderRadius,
          })}
        >
          <ClassifierOptimizerSettings trainable={trainable} />
        </Grid>
      </Grid>
      <ExportHyperparametersButton />
    </div>
  );
};

export default TrainingSettings;
