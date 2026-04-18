import { Grid2 as Grid } from "@mui/material";
import { ImageAugmentationSettings } from "./ImageAugmentationSettings";
import { DataPartitioningSettings } from "./DataPartitioningSettings";

export const ClassifierPreprocessingSettings = () => {
  return (
    <Grid container spacing={2} padding={2}>
      <ImageAugmentationSettings />
      <DataPartitioningSettings />
    </Grid>
  );
};
