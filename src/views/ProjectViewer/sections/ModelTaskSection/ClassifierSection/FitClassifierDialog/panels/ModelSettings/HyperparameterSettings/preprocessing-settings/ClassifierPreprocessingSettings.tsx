import {
  Collapse,
  Divider,
  Grid2 as Grid,
  Stack,
  Typography,
} from "@mui/material";

import {
  CropSection,
  InputShape,
  NormalizeOptions,
  Shuffle,
  TrainingPercentage,
} from "./fields";

export const ClassifierPreprocessingSettings = ({
  showAdvanced,
}: {
  showAdvanced: boolean;
}) => {
  return (
    <Grid container spacing={2} padding={2}>
      <Grid size={12}>
        <Divider sx={{ mb: 1 }}>
          <Typography variant="body2">Image Augmentation</Typography>
        </Divider>

        <Stack sx={{ pl: 2 }} spacing={4}>
          <InputShape />
          <Collapse in={showAdvanced} style={{ marginTop: 0 }}>
            <Stack spacing={4} sx={{ mt: 4 }}>
              <CropSection />
              <NormalizeOptions />
            </Stack>
          </Collapse>
        </Stack>
      </Grid>
      <Grid size={12}>
        <Divider sx={{ mb: 1 }}>
          <Typography variant="body2">Data Partitioning</Typography>
        </Divider>

        <Stack sx={{ pl: 2 }}>
          <TrainingPercentage />
          <Collapse in={showAdvanced}>
            <Shuffle />
          </Collapse>
        </Stack>
      </Grid>
    </Grid>
  );
};
