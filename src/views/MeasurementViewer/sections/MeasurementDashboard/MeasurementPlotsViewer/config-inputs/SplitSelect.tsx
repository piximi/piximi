import { useMemo } from "react";

import { useDispatch } from "react-redux";

import { MenuItem } from "@mui/material";

import { HelpItem } from "help/HelpContent";

import { measurementsSlice } from "@MeasurementViewer/state";

import { ChartConfigSelect } from "./ChartConfigSelect";

import type { SelectChangeEvent } from "@mui/material";

import type { KeysWithValuesOfType } from "utils/types";

import type {
  ChartConfig,
  PlotDetail,
  SplitType,
} from "@MeasurementViewer/types";

const splitTypes = ["partition", "category", "trackId"];

const renderDefaultValue = (defaultValue: string) => (value: string) => {
  if (value === "") {
    return defaultValue;
  } else {
    return value;
  }
};

export const SplitSelect = ({
  plot,
  type,
  nullable,
}: {
  plot: PlotDetail;
  type: KeysWithValuesOfType<ChartConfig, SplitType>;
  nullable?: boolean;
}) => {
  const dispatch = useDispatch();
  const handleChange = (event: SelectChangeEvent<string>) => {
    dispatch(
      measurementsSlice.actions.updateActiveSelectedPlot({
        plotId: plot.id,
        newConfig: { [type]: event.target.value as SplitType },
      }),
    );
  };

  const selectOptions = useMemo(
    () =>
      (nullable ? ["None", ...splitTypes] : splitTypes).map((option) => {
        return (
          <MenuItem key={option} dense value={option}>
            {option}
          </MenuItem>
        );
      }),
    [nullable],
  );

  const defaultValue = useMemo(
    () => (nullable ? "--" : `Select ${type} split`),
    [nullable, type],
  );

  const inputValue = useMemo(() => plot.chartConfig[type] ?? "", [type, plot]);

  return (
    <ChartConfigSelect
      data-help={HelpItem.MeasurementPlotColor}
      label={type}
      id={`${type}-select`}
      defaultValue={defaultValue}
      inputValue={inputValue}
      handleChange={handleChange}
      renderValue={renderDefaultValue(defaultValue)}
      selectOptions={selectOptions}
    />
  );
};
