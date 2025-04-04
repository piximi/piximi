import { Grid2 as Grid, Typography } from "@mui/material";
import { ClassifierPreprocessingSettings } from "./preprocessing-settings";
import { ClassifierOptimizerSettings } from "./optimizer-settings";

export const HyperperameterSettings = () => {
  return (
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
        <ClassifierPreprocessingSettings />
      </Grid>
      <Grid
        size={6}
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
        })}
      >
        <ClassifierOptimizerSettings />
      </Grid>
    </Grid>
  );
};
