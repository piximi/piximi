import { useDispatch } from "react-redux";

import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";

import { measurementsSlice } from "@MeasurementViewer/state";

import type { PlotDetail } from "@MeasurementViewer/types";

export const HistogramBinLabelCheckbox = ({ plot }: { plot: PlotDetail }) => {
  const dispatch = useDispatch();
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      measurementsSlice.actions.updateActiveSelectedPlot({
        plotId: plot.id,
        newConfig: { binLabel: event.target.checked },
      }),
    );
  };

  return (
    <FormControlLabel
      control={
        <Checkbox
          size="small"
          checked={!!plot.chartConfig.binLabel}
          onChange={handleChange}
        />
      }
      label={
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignContent: "center",
          }}
        >
          <Typography variant="body2">Show Bin Label</Typography>
        </Box>
      }
    />
  );
};
