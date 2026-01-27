import {
  ChartMeasurementSelect,
  ChartSplitSelect,
  HistogramBinTextField,
  SwarmStatisticsCheckbox,
} from "./ControlInputs";

export const HistogramOptions = () => {
  return (
    <>
      <ChartMeasurementSelect type="x-axis" />
      <HistogramBinTextField />
    </>
  );
};
export const ScatterOptions = () => {
  return (
    <>
      <ChartMeasurementSelect type="x-axis" />
      <ChartMeasurementSelect type="y-axis" />
      <ChartMeasurementSelect type="size" nullable={true} />
      <ChartSplitSelect type="color" nullable={true} />
    </>
  );
};

export const SwarmOptions = () => {
  return (
    <>
      <ChartMeasurementSelect type="y-axis" />
      <ChartSplitSelect type="swarmGroup" />
      <ChartMeasurementSelect type="size" nullable={true} />
      <SwarmStatisticsCheckbox />
    </>
  );
};
