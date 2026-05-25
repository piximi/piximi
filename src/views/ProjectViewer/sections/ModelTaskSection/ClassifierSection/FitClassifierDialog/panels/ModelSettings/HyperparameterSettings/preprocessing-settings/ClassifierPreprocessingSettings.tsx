import { Grid2 as Grid } from "@mui/material";

import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { ImageAugmentationSettings } from "./ImageAugmentationSettings";
import { DataPartitioningSettings } from "./DataPartitioningSettings";

export const ClassifierPreprocessingSettings = () => {
  const { classifierStatus } = useClassifierStatus();
  return (
    <Grid container spacing={2} padding={2}>
      <ImageAugmentationSettings isTraining={classifierStatus === "training"} />
      <DataPartitioningSettings isTraining={classifierStatus === "training"} />
    </Grid>
  );
};
