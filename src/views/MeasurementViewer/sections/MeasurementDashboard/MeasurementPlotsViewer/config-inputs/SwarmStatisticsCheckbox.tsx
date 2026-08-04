import { useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import {
  Box,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { HelpOutlineOutlined as HelpOutlineOutlinedIcon } from "@mui/icons-material";

import { measurementsSlice } from "@MeasurementViewer/state";
import { selectActiveSelectedPlot } from "@MeasurementViewer/state/selectors";

export const SwarmStatisticsCheckbox = () => {
  const selectedPlot = useSelector(selectActiveSelectedPlot);
  if (!selectedPlot) return null;
  const dispatch = useDispatch();
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      measurementsSlice.actions.updateActiveSelectedPlot({
        plotId: selectedPlot.id,
        newConfig: { swarmStatistics: event.target.checked },
      }),
    );
  };

  return (
    <FormControlLabel
      control={
        <Checkbox
          size="small"
          checked={selectedPlot.chartConfig.swarmStatistics}
          onChange={handleChange}
        />
      }
      label={
        <Box display="flex" flexDirection="row" alignContent="center">
          <Typography variant="body2">Show Statistics</Typography>
          <Tooltip
            title={<BoxPlotHelpTooltip />}
            placement="top"
            disableInteractive
          >
            <HelpOutlineOutlinedIcon
              sx={(theme) => ({ fontSize: theme.typography.body2, ml: 1 })}
            />
          </Tooltip>
        </Box>
      }
    />
  );
};

const BoxPlotHelpTooltip = () => {
  const muiTheme = useTheme();

  const helpTextColor = useMemo(
    () => muiTheme.palette.getContrastText(muiTheme.palette.background.paper),
    [muiTheme],
  );
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Box and Median Line */}
      <rect
        width="80"
        height="100"
        x="25"
        y="50"
        fill="#02aec560"
        stroke="#00acc3"
        rx="8"
      />
      <line x1="25" y1="100" x2="105" y2="100" stroke="#00acc3" />
      <text x="115" y="55" fontSize="10" fill={helpTextColor}>
        Upper Quartile
      </text>
      <text x="115" y="105" fontSize="10" fill={helpTextColor}>
        Median
      </text>
      <text x="115" y="150" fontSize="10" fill={helpTextColor}>
        Lower Quartile
      </text>
      {/* Max */}
      <line x1="65" y1="25" x2="65" y2="50" stroke="#00acc3" />
      <line x1="25" y1="25" x2="105" y2="25" stroke="#00acc3" />
      <text x="115" y="30" fontSize="10" fill={helpTextColor}>
        Max
      </text>
      {/* Min */}
      <line x1="65" y1="150" x2="65" y2="175" stroke="#00acc3" />
      <line x1="25" y1="175" x2="105" y2="175" stroke="#00acc3" />
      <text x="115" y="180" fontSize="10" fill={helpTextColor}>
        Min
      </text>
    </svg>
  );
};
