import { useSelector } from "react-redux";

import { Box } from "@mui/material";

import { selectActiveSelectedPlot } from "@MeasurementViewer/state/selectors";

import { MeasurementPlotsContent } from "./MeasurementPlotsContent";

export const MeasurementPlotsViewer = () => {
  const selectedPlot = useSelector(selectActiveSelectedPlot);

  return !selectedPlot ? null : (
    <Box
      data-id="plotsContainer"
      sx={{
        width: "100%",
        display: "flex",
        height: "100%",
        flexDirection: "row",
      }}
    >
      <MeasurementPlotsContent plot={selectedPlot} />
    </Box>
  );
};
