import {
  Collapse,
  Divider,
  Grid2 as Grid,
  Stack,
  Typography,
} from "@mui/material";

import {
  BatchSize,
  Epochs,
  LearningRate,
  LossFunction,
  OptimizationAlgorithm,
} from "./fields";

export const ClassifierOptimizerSettings = ({
  showAdvanced,
}: {
  showAdvanced: boolean;
}) => {
  return (
    <Grid container spacing={2} padding={2}>
      <Grid size={12}>
        <Divider sx={{ mb: 1 }}>
          <Typography variant="body2">Training Strategy</Typography>
        </Divider>

        <Stack sx={{ pl: 2 }}>
          <Stack direction="row" gap={2} sx={{ pt: 1 }}>
            <Epochs />
            <Collapse in={showAdvanced}>
              <BatchSize />
            </Collapse>
          </Stack>
        </Stack>
      </Grid>
      <Grid size={12}>
        <Divider sx={{ mb: 1 }}>
          <Typography variant="body2">Optimization</Typography>
        </Divider>

        <Collapse in={showAdvanced}>
          <Stack sx={{ pl: 2 }} spacing={2}>
            <OptimizationAlgorithm />
            <LossFunction />
            <LearningRate />
          </Stack>
        </Collapse>
      </Grid>
    </Grid>
  );
};
