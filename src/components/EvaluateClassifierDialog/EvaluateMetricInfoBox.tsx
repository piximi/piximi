import { Box, IconButton } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

type EvaluateMetricInfoBoxProps = {
  metric: string;
  value: number;
  link: string;
};

export const EvaluateMetricInfoBox = (props: EvaluateMetricInfoBoxProbs) => {
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
          m: 3,
          width: 180,
          borderRadius: 2,
        })}
      >
        <Box
          component="span"
          sx={(theme) => ({
            fontSize: 20,
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
            fontSize: 18,
            color: theme.palette.background.default,
            pl: 1,
          })}
        >
          {value.toFixed(3)}
        </Box>
        <IconButton
          aria-label="info"
          sx={(theme) => ({ color: theme.palette.background.default })}
          onClick={() => window.open(link)}
        >
          <InfoIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
