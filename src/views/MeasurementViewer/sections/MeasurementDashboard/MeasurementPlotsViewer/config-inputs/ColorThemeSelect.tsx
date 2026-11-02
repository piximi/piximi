import { useMemo } from "react";

import { useDispatch } from "react-redux";

import { ListSubheader, MenuItem } from "@mui/material";

import { HelpItem } from "help/HelpContent";

import { nivoColorSpaces } from "themes/nivoTheme";

import { measurementsSlice } from "@MeasurementViewer/state";

import { ChartConfigSelect } from "./ChartConfigSelect";

import type { ReactElement } from "react";

import type { ColorSchemeId } from "@nivo/colors";

import type { SelectChangeEvent } from "@mui/material";

import type { PlotDetail } from "@MeasurementViewer/types";

const selectOptions = Object.values(nivoColorSpaces).reduce(
  (elementArray: ReactElement[], space) => {
    elementArray.push(
      <ListSubheader key={`color-space-${space.name}`}>
        {space.name}
      </ListSubheader>,
    );
    Object.values(space.themes).forEach((theme) => {
      elementArray.push(
        <MenuItem key={`color-theme-${theme.name}`} value={theme.name}>
          {theme.name}
          {theme.sample.map((color, idx) => {
            return (
              <span
                key={`${theme.name}-span-${idx}`}
                style={{
                  display: "inline-block",
                  background: color,
                  width: "18px",
                  height: "18px",
                }}
              ></span>
            );
          })}
        </MenuItem>,
      );
    });
    return elementArray;
  },
  [],
);

const defaultValue = "Select color theme";

// Needed to show just the name of the color theme, instead of the whole swatch name
const renderValue = (value: string) => {
  return value;
};

export const ColorThemeSelect = ({ plot }: { plot: PlotDetail }) => {
  const dispatch = useDispatch();
  const handleChange = (event: SelectChangeEvent<string>) => {
    dispatch(
      measurementsSlice.actions.updateActiveSelectedPlot({
        plotId: plot.id,
        newConfig: { colorTheme: event.target.value as ColorSchemeId },
      }),
    );
  };

  const inputValue = useMemo(() => plot.chartConfig.colorTheme ?? "", [plot]);

  return (
    <ChartConfigSelect
      data-help={HelpItem.MeasurementPlotColorMap}
      label="Color Theme"
      id="color-theme-select"
      defaultValue={defaultValue}
      inputValue={inputValue}
      handleChange={handleChange}
      renderValue={renderValue}
      selectOptions={selectOptions}
    />
  );
};
