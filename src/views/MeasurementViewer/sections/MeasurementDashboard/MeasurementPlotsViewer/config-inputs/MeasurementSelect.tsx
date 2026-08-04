import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { MenuItem } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { measurementsSlice } from "@MeasurementViewer/state";
import {
  selectActiveMeasurements,
  selectActiveSelectedPlot,
} from "@MeasurementViewer/state/selectors";

import type { KeysWithValuesOfType } from "utils/types";

import { ChartConfigSelect } from "./ChartConfigSelect";

import type { ChartConfig } from "@MeasurementViewer/types";

export const MeasurementSelect = ({
  type,
  nullable,
  timeSeries,
}: {
  type: KeysWithValuesOfType<ChartConfig, string>;
  nullable?: boolean;
  timeSeries?: boolean;
}) => {
  const selectedPlot = useSelector(selectActiveSelectedPlot);
  if (!selectedPlot) return null;
  const activeMeasurements = useSelector(selectActiveMeasurements);
  const dispatch = useDispatch();

  const handleChange = (event: SelectChangeEvent<string>) => {
    dispatch(
      measurementsSlice.actions.updateActiveSelectedPlot({
        plotId: selectedPlot.id,
        newConfig: {
          [type]:
            event.target.value === "None" ? undefined : event.target.value,
        },
      }),
    );
  };

  const helpType = useMemo(() => {
    switch (type) {
      case "x-axis":
        return HelpItem.MeasurementPlotXAxis;
      case "y-axis":
        return HelpItem.MeasurementPlotYAxis;
      case "size":
        return HelpItem.MeasurementPlotSize;
      default:
        return undefined;
    }
  }, [type]);

  const selectOptions = useMemo(() => {
    const baseOptions = (
      nullable ? ["None", ...activeMeasurements] : activeMeasurements
    ).map((option) => {
      return (
        <MenuItem key={option} dense value={option}>
          {option}
        </MenuItem>
      );
    });
    if (timeSeries) {
      baseOptions.push(
        <MenuItem key={"timepoint"} dense value={"timepoint"}>
          Timepoint
        </MenuItem>,
      );
    }
    return baseOptions;
  }, [activeMeasurements, nullable, timeSeries]);

  const defaultValue = useMemo(
    () => (nullable ? "--" : `Select ${type} measurement`),
    [nullable, type],
  );

  const inputValue = useMemo(
    () => selectedPlot.chartConfig[type] ?? "",
    [type, selectedPlot.chartConfig],
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
      data-help={helpType}
      label={type}
      id={`${type}-select`}
      defaultValue={defaultValue}
      inputValue={inputValue}
      handleChange={handleChange}
      renderValue={renderValue}
      selectOptions={selectOptions}
    />
  );
};
