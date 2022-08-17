import { Box, LinearProgress, Typography } from "@mui/material";

type FitSegmenterProgressBarProps = {
  epochs: number;
  currentEpoch: number;
};

export const FitSegmenterProgressBar = ({
  epochs,
  currentEpoch,
}: FitSegmenterProgressBarProps) => {
  const progressPercentage = (currentEpoch / epochs) * 100;
  const settingUpTraining = currentEpoch === 0;

  return (
    <div>
      {settingUpTraining ? (
        <div>
          <Box sx={{ width: 200, mr: 5 }}>
            <LinearProgress />
          </Box>
          <Box sx={{ minWidth: 50 }}>
            <Typography variant="body2" color="text.secondary">
              {" "}
              {"Setting up training..."}{" "}
            </Typography>
          </Box>
        </div>
      ) : (
        <div>
          <Box sx={{ width: 200, mr: 5 }}>
            <LinearProgress variant="determinate" value={progressPercentage} />
          </Box>
          <Box sx={{ minWidth: 50 }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >{`Epoch ${currentEpoch} of ${epochs}`}</Typography>
          </Box>
        </div>
      )}
    </div>
  );
};
