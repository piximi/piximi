import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import { MenuItem } from "@mui/material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { measurementsSlice } from "@MeasurementViewer/state";
import { selectActiveSelectedPlot } from "@MeasurementViewer/state/selectors";

import type { KeysWithValuesOfType } from "utils/types";

import { ChartConfigSelect } from "./ChartConfigSelect";

import type { ChartConfig, SplitType } from "@MeasurementViewer/types";

const splitTypes = ["partition", "category", "trackId"];

export const SplitSelect = ({
  type,
  nullable,
}: {
  type: KeysWithValuesOfType<ChartConfig, SplitType>;
  nullable?: boolean;
}) => {
  const selectedPlot = useSelector(selectActiveSelectedPlot);
  if (!selectedPlot) return null;
  const dispatch = useDispatch();
  const handleChange = (event: SelectChangeEvent<string>) => {
    dispatch(
      measurementsSlice.actions.updateActiveSelectedPlot({
        plotId: selectedPlot.id,
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
      data-help={HelpItem.MeasurementPlotColor}
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
