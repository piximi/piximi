import { v4 as uuidv4 } from "uuid";

import { ChartConfig, ChartType } from "../types";

export const initialChartConfig: ChartConfig = {
  chart: ChartType.Histogram,
  colorTheme: "nivo",
  numBins: 10,
};
const initialPlotId = uuidv4();
export const initialPlotView = {
  selectedPlot: initialPlotId,
  plots: {
    [initialPlotId]: {
      id: initialPlotId,
      name: "Plot 1",
      chartConfig: initialChartConfig,
    },
  },
};
