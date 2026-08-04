import { useDispatch, useSelector } from "react-redux";

import { Box, Checkbox, FormControlLabel, Typography } from "@mui/material";

import { measurementsSlice } from "@MeasurementViewer/state";
import { selectActiveSelectedPlot } from "@MeasurementViewer/state/selectors";

export const HistogramBinLabelCheckbox = () => {
  const selectedPlot = useSelector(selectActiveSelectedPlot);
  if (!selectedPlot) return null;
  const dispatch = useDispatch();
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      measurementsSlice.actions.updateActiveSelectedPlot({
        plotId: selectedPlot.id,
        newConfig: { binLabel: event.target.checked },
      }),
    );
  };

  return (
    <FormControlLabel
      control={
        <Checkbox
          size="small"
          checked={!!selectedPlot.chartConfig.binLabel}
          onChange={handleChange}
        />
      }
      label={
        <Box display="flex" flexDirection="row" alignContent="center">
          <Typography variant="body2">Show Bin Label</Typography>
        </Box>
      }
    />
  );
};
