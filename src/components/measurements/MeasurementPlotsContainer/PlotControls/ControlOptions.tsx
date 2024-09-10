import {
  ChartMeasurementSelect,
  ChartSplitSelect,
  HistogramBinTextField,
  SwarmStatisticsCheckbox,
} from "./ControlInputs";

export const HistogramOptions = () => {
  return <HistogramBinTextField />;
};
export const ScatterOptions = () => {
  return (
    <>
      <ChartMeasurementSelect type="x-axis" />
      <ChartMeasurementSelect type="size" nullable={true} />
      <ChartSplitSelect type="color" nullable={true} />
    </>
  );
};

export const SwarmOptions = () => {
  return (
    <>
      <ChartSplitSelect type="swarmGroup" />
      <ChartMeasurementSelect type="size" nullable={true} />
      <SwarmStatisticsCheckbox />
    </>
  );
};
