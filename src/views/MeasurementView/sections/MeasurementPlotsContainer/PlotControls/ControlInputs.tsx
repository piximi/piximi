import { ReactElement, ReactNode, useCallback, useMemo } from "react";
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import type { ColorSchemeId } from "@nivo/colors";

import { useMeasurementParameters, usePlotControl } from "../../../hooks";

import { CustomNumberTextField } from "components/inputs";

import { capitalize } from "utils/common/helpers";

import { KeysWithValuesOfType } from "utils/common/types";
import { ChartConfig, ChartItem, ChartType, SplitType } from "../../../types";

import { nivoColorSpaces } from "themes/nivoTheme";

const splitTypes = ["partition", "category"];

export const ColorThemeSelect = () => {
  const { selectedPlot, updateChartConfig } = usePlotControl();
  const handleChange = (event: SelectChangeEvent<string>) => {
    updateChartConfig("colorTheme", event.target.value as ColorSchemeId);
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
    <ChartControlSelect
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

export const PlotSelect = () => {
  const { selectedPlot, updateChartConfig } = usePlotControl();
  const handleChange = (event: SelectChangeEvent<string>) => {
    updateChartConfig("chart", event.target.value as ChartType);
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
    <ChartControlSelect
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

export const ChartMeasurementSelect = ({
  type,
  nullable,
}: {
  type: KeysWithValuesOfType<ChartConfig, ChartItem>;
  nullable?: boolean;
}) => {
  const { selectedPlot, updateChartConfig } = usePlotControl();
  const { measurementPlotOptions } = useMeasurementParameters();

  const handleChange = (event: SelectChangeEvent<string>) => {
    updateChartConfig(type, measurementPlotOptions[event.target.value]);
  };

  const selectOptions = useMemo(
    () =>
      (nullable
        ? ["None", ...Object.keys(measurementPlotOptions)]
        : Object.keys(measurementPlotOptions)
      ).map((option) => {
        return (
          <MenuItem key={option} dense value={option}>
            {option}
          </MenuItem>
        );
      }),
    [measurementPlotOptions, nullable],
  );

  const defaultValue = useMemo(
    () => (nullable ? "--" : `Select ${type} measurement`),
    [nullable, type],
  );

  const inputValue = useMemo(
    () => selectedPlot.chartConfig[type]?.measurementType ?? "",
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
    <ChartControlSelect
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

export const ChartSplitSelect = ({
  type,
  nullable,
}: {
  type: KeysWithValuesOfType<ChartConfig, SplitType>;
  nullable?: boolean;
}) => {
  const { selectedPlot, updateChartConfig } = usePlotControl();
  const handleChange = (event: SelectChangeEvent<string>) => {
    updateChartConfig(type, event.target.value as SplitType);
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
    <ChartControlSelect
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

const ChartControlSelect = ({
  label,
  id,
  inputValue,
  defaultValue,
  handleChange,
  selectOptions,
  renderValue,
}: {
  label: string;
  id: string;
  inputValue: string;
  defaultValue: string;
  handleChange: (event: SelectChangeEvent<string>) => void;
  selectOptions: ReactNode;
  renderValue: (value: string) => string;
}) => {
  return (
    <FormControl fullWidth sx={{ pb: 1, mt: 1 }}>
      <InputLabel
        variant="standard"
        htmlFor={id}
        sx={(theme) => ({
          "& .MuiInputLabel-root": {
            fontSize: theme.typography.body2,
          },
        })}
        size="small"
        shrink={defaultValue || inputValue ? true : false}
      >
        {capitalize(label)}
      </InputLabel>
      <Select
        id={id}
        value={inputValue}
        displayEmpty={defaultValue ? true : false}
        size="small"
        variant="standard"
        onChange={handleChange}
        renderValue={renderValue}
        sx={(theme) => ({
          fontSize: theme.typography.body2,
        })}
      >
        {selectOptions}
      </Select>
    </FormControl>
  );
};

export const SwarmStatisticsCheckbox = () => {
  const { selectedPlot, updateChartConfig } = usePlotControl();
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateChartConfig("swarmStatistics", event.target.checked);
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

export const HistogramBinTextField = () => {
  const { selectedPlot, updateChartConfig } = usePlotControl();
  const handleChange = (numBins: number) => {
    updateChartConfig("numBins", numBins);
  };
  return (
    <CustomNumberTextField
      id="bin-size-text-field"
      label="Number of Bins"
      value={selectedPlot.chartConfig.numBins!}
      dispatchCallBack={handleChange}
      size="small"
      variant="standard"
      formControlFullWidth
      formControlProps={{ sx: { pb: 1, mt: 1 }, fullWidth: true }}
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
