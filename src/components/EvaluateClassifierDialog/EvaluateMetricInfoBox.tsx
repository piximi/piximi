import { Box, IconButton } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

type EvaluateMetricInfoBoxProbs = {
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
        sx={{
          backgroundColor: "#0080ff",
          display: "flex",
          flexDirection: "column",
          alignItems: { xs: "center", md: "flex-start" },
          m: 3,
          width: 180,
          borderRadius: 2,
        }}
      >
        <Box
          component="span"
          sx={{ fontSize: 20, color: "#1034a6", mt: 1, pl: 1, pr: 1 }}
        >
          {metric}:
        </Box>
        <Box component="span" sx={{ fontSize: 18, color: "#D3D3D3", pl: 1 }}>
          {value.toFixed(3)}
        </Box>
        <IconButton
          aria-label="info"
          sx={{ color: "#D3D3D3" }}
          onClick={() => window.open(link)}
        >
          <InfoIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
