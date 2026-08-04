import { v4 as uuidv4 } from "uuid";

import { initialChartConfig } from "./initialStates";

import { PlotDetails, PlotViewActionProps } from "../types";

export function plotViewReducer(
  plotDetails: PlotDetails,
  action: PlotViewActionProps,
) {
  const { type } = action;
  switch (type) {
    case "add": {
      const numPlots = Object.keys(plotDetails.plots).length;
      const plotId = uuidv4();
      const plotName = `Plot ${numPlots + 1}`;

      plotDetails.plots[plotId] = {
        id: plotId,
        name: plotName,
        chartConfig: initialChartConfig,
      };
      return structuredClone(plotDetails);
    }
    case "edit":
      plotDetails.plots[action.id!].name = action.name!;
      return structuredClone(plotDetails);
    case "remove":
      if (action.newId) {
        plotDetails.selectedPlot = action.newId;
      }
      delete plotDetails.plots[action.id!];
      return structuredClone(plotDetails);
    case "update":
      plotDetails.plots[action.id!].chartConfig = action.chartConfig!;
      return structuredClone(plotDetails);
    case "select":
      plotDetails.selectedPlot = action.id;
      return { ...plotDetails };
  }
}
