import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { MenuItem } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { measurementsSlice } from "@MeasurementViewer/state";
import { selectActiveSelectedPlot } from "@MeasurementViewer/state/selectors";
import { ChartType } from "@MeasurementViewer/types";

import { ChartConfigSelect } from "./ChartConfigSelect";

export const PlotSelect = () => {
  const selectedPlot = useSelector(selectActiveSelectedPlot);
  if (!selectedPlot) return null;
  const dispatch = useDispatch();
  const handleChange = (event: SelectChangeEvent<string>) => {
    dispatch(
      measurementsSlice.actions.updateActiveSelectedPlot({
        plotId: selectedPlot.id,
        newConfig: { chart: event.target.value as ChartType },
      }),
    );
  };

  const selectOptions = useMemo(
    () =>
      Object.keys(ChartType).map((option) => {
        return (
          <MenuItem key={option} dense value={option}>
            {option}
          </MenuItem>
        );
      }),
    [],
  );

  const defaultValue = useMemo(() => "Select plot type", []);

  const inputValue = useMemo(
    () => selectedPlot.chartConfig.chart ?? "",
    [selectedPlot.chartConfig],
  );
  const renderValue = useCallback(
    (value: string) => {
      if (value === "") {
        return defaultValue;
      } else {
        return value;
      }
    },
    [defaultValue],
  );

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
