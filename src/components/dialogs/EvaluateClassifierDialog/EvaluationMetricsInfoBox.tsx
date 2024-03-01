import { Box, IconButton } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

type EvaluateMetricInfoBoxProps = {
  metric: string;
  value: number;
  link: string;
};

export const EvaluationMetricsInfoBox = (props: EvaluateMetricInfoBoxProps) => {
  const { metric, value, link } = props;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <Box
        sx={(theme) => ({
          backgroundColor: theme.palette.info.light,
          display: "flex",
          flexDirection: "column",
          alignItems: { xs: "center", md: "flex-start" },
          m: 1,
          width: 130,
          borderRadius: 2,
        })}
      >
        <Box
          component="span"
          sx={(theme) => ({
            fontSize: 16,
            color: theme.palette.info.dark,
            mt: 1,
            pl: 1,
            pr: 1,
          })}
        >
          {metric}:
        </Box>
        <Box
          component="span"
          sx={(theme) => ({
            fontSize: 15,
            color: theme.palette.background.default,
            pl: 1,
          })}
        >
          {Number.isNaN(value) ? "N/A" : value.toFixed(3)}
        </Box>
        <IconButton
          size="small"
          aria-label="info"
          sx={(theme) => ({ color: theme.palette.background.default })}
          onClick={() => window.open(link)}
        >
          <InfoIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};
