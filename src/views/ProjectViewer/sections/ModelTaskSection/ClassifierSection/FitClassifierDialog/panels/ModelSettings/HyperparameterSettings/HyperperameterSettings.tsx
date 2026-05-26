import { useState } from "react";

import { Button, Grid2 as Grid, Typography } from "@mui/material";

import { ClassifierPreprocessingSettings } from "./preprocessing-settings";
import { ClassifierOptimizerSettings } from "./optimizer-settings";

export const HyperperameterSettings = () => {
  const [showAdvancedPreprocess, setShowAdvancedPreprocess] = useState(false);
  const [showAdvancedOptimizer, setShowAdvancedOptimizer] = useState(false);

  return (
    <Grid container columnSpacing={1}>
      <Grid
        size={6}
        sx={{ px: 2, display: "flex", justifyContent: "space-between" }}
      >
        <Typography>Data Preprocessing Settings</Typography>
        <Button
          variant="text"
          sx={(theme) => ({
            p: 0,
            fontSize: theme.typography.body2.fontSize,
            backgroundColor: "transparent",
          })}
          onClick={() => setShowAdvancedPreprocess((v) => !v)}
        >
          {showAdvancedPreprocess ? "Hide Advanced" : "Show Advanced"}
        </Button>
      </Grid>
      <Grid
        size={6}
        sx={{ px: 2, display: "flex", justifyContent: "space-between" }}
      >
        <Typography>Optimization Settings</Typography>
        <Button
          variant="text"
          sx={(theme) => ({
            p: 0,
            fontSize: theme.typography.body2.fontSize,
            backgroundColor: "transparent",
          })}
          onClick={() => setShowAdvancedOptimizer((v) => !v)}
        >
          {showAdvancedOptimizer ? "Hide Advanced" : "Show Advanced"}
        </Button>
      </Grid>
      <Grid
        size={6}
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
        })}
      >
        <ClassifierPreprocessingSettings
          showAdvanced={showAdvancedPreprocess}
        />
      </Grid>
      <Grid
        size={6}
        sx={(theme) => ({
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.shape.borderRadius,
        })}
      >
        <ClassifierOptimizerSettings showAdvanced={showAdvancedOptimizer} />
      </Grid>
    </Grid>
  );
};
