import { useMemo } from "react";

import { useDispatch } from "react-redux";

import { MenuItem } from "@mui/material";

import { HelpItem } from "help/HelpContent";

import { measurementsSlice } from "@MeasurementViewer/state";
import { ChartType } from "@MeasurementViewer/types";

import { ChartConfigSelect } from "./ChartConfigSelect";

import type { SelectChangeEvent } from "@mui/material";

import type { PlotDetail } from "@MeasurementViewer/types";

const selectOptions = Object.keys(ChartType).map((option) => {
  return (
    <MenuItem key={option} dense value={option}>
      {option}
    </MenuItem>
  );
});
const defaultValue = "Select plot type";
export const PlotSelect = ({ plot }: { plot: PlotDetail }) => {
  const dispatch = useDispatch();
  const handleChange = (event: SelectChangeEvent<string>) => {
    dispatch(
      measurementsSlice.actions.updateActiveSelectedPlot({
        plotId: plot.id,
        newConfig: { chart: event.target.value as ChartType },
      }),
    );
  };

  const inputValue = useMemo(() => plot.chartConfig.chart ?? "", [plot]);
  const renderValue = (value: string) => {
    if (value === "") {
      return defaultValue;
    } else {
      return value;
    }
  };

  return (
    <ChartConfigSelect
      data-help={HelpItem.MeasurementPlotType}
      label="plot"
      id="plot-select"
      defaultValue={defaultValue}
      inputValue={inputValue}
      handleChange={handleChange}
      renderValue={renderValue}
      selectOptions={selectOptions}
    />
  );
};
