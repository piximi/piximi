import {
  HistogramBinLabelCheckbox,
  MeasurementSelect,
  SplitSelect,
  ColorThemeSelect,
  HistogramBinTextField,
  PlotSelect,
  SwarmStatisticsCheckbox,
} from "./config-inputs";

import type { PlotDetail } from "@MeasurementViewer/types";

export const HistogramConfig = ({ plot }: { plot: PlotDetail }) => {
  return (
    <>
      <MeasurementSelect type="x-axis" plot={plot} />
      <HistogramBinTextField key={plot.id} plot={plot} />
      <HistogramBinLabelCheckbox plot={plot} />
    </>
  );
};
export const ScatterConfig = ({ plot }: { plot: PlotDetail }) => {
  return (
    <>
      <MeasurementSelect type="x-axis" plot={plot} />
      <MeasurementSelect type="y-axis" plot={plot} />
      <MeasurementSelect type="size" nullable={true} plot={plot} />
      <SplitSelect type="color" nullable={true} plot={plot} />
    </>
  );
};

export const SwarmConfig = ({ plot }: { plot: PlotDetail }) => {
  return (
    <>
      <MeasurementSelect type="y-axis" plot={plot} />
      <SplitSelect type="swarmGroup" plot={plot} />
      <MeasurementSelect type="size" nullable={true} plot={plot} />
      <SwarmStatisticsCheckbox plot={plot} />
    </>
  );
};

export const BaseConfig = ({ plot }: { plot: PlotDetail }) => {
  return (
    <>
      <PlotSelect plot={plot} />
      <ColorThemeSelect plot={plot} />
    </>
  );
};
