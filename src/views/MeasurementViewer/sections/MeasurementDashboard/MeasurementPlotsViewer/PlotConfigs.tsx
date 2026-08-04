import {
  HistogramBinLabelCheckbox,
  MeasurementSelect,
  SplitSelect,
  ColorThemeSelect,
  HistogramBinTextField,
  PlotSelect,
  SwarmStatisticsCheckbox,
} from "./config-inputs";

export const HistogramConfig = () => {
  return (
    <>
      <MeasurementSelect type="x-axis" />
      <HistogramBinTextField />
      <HistogramBinLabelCheckbox />
    </>
  );
};
export const ScatterConfig = () => {
  return (
    <>
      <MeasurementSelect type="x-axis" timeSeries={true} />
      <MeasurementSelect type="y-axis" />
      <MeasurementSelect type="size" nullable={true} />
      <SplitSelect type="color" nullable={true} />
    </>
  );
};

export const SwarmConfig = () => {
  return (
    <>
      <MeasurementSelect type="y-axis" />
      <SplitSelect type="swarmGroup" />
      <MeasurementSelect type="size" nullable={true} />
      <SwarmStatisticsCheckbox />
    </>
  );
};

export const BaseConfig = () => {
  return (
    <>
      <PlotSelect />
      <ColorThemeSelect />
    </>
  );
};
