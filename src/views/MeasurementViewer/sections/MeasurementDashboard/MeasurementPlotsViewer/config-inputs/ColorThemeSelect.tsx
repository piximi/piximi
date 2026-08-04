import type { ReactElement } from "react";
import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { ListSubheader, MenuItem } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { selectActiveSelectedPlot } from "@MeasurementViewer/state/selectors";
import { measurementsSlice } from "@MeasurementViewer/state";

import { nivoColorSpaces } from "themes/nivoTheme";

import { ChartConfigSelect } from "./ChartConfigSelect";

import type { ColorSchemeId } from "@nivo/colors";

export const ColorThemeSelect = () => {
  const selectedPlot = useSelector(selectActiveSelectedPlot);
  if (!selectedPlot) return null;
  const dispatch = useDispatch();
  const handleChange = (event: SelectChangeEvent<string>) => {
    dispatch(
      measurementsSlice.actions.updateActiveSelectedPlot({
        plotId: selectedPlot.id,
        newConfig: { colorTheme: event.target.value as ColorSchemeId },
      }),
    );
  };

  const selectOptions = useMemo(
    () =>
      Object.values(nivoColorSpaces).reduce(
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
      ),
    [],
  );

  const defaultValue = useMemo(() => "Select color theme", []);

  const inputValue = useMemo(
    () => selectedPlot.chartConfig.colorTheme ?? "",
    [selectedPlot.chartConfig],
  );

  const renderValue = useCallback((value: string) => {
    return value;
  }, []);

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
