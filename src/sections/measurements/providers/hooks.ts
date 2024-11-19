import { useCallback, useContext, useMemo } from "react";

import { MeasurementsContext, PlotViewContext } from "./MeasurementsProvider";
import { ChartConfig } from "../types";

export const useMeasurementParameters = () => {
  return useContext(MeasurementsContext)!;
};

export const usePlotControl = () => {
  const { plotDetails, dispatch } = useContext(PlotViewContext)!;
  const selectedPlot = useMemo(() => {
    return plotDetails.plots[plotDetails.selectedPlot];
  }, [plotDetails]);

  const plotTabLabels = useMemo(() => {
    return Object.keys(plotDetails.plots);
  }, [plotDetails.plots]);

  const renderLabel = useCallback(
    (label: string) => {
      return plotDetails.plots[label].name;
    },
    [plotDetails.plots]
  );
  const addPlot = useCallback(() => {
    dispatch({ type: "add" });
  }, [dispatch]);
  const editPlot = useCallback(
    (id: string, name: string) => {
      dispatch({ type: "edit", id, name });
    },
    [dispatch]
  );
  type NewType = ChartConfig;

  const updateChartConfig = useCallback(
    <T extends keyof ChartConfig, V extends NewType[T]>(key: T, value: V) => {
      const currentPlot = plotDetails.plots[plotDetails.selectedPlot];
      const newConfig = { ...currentPlot.chartConfig, [key]: value };
      dispatch({
        type: "update",
        id: currentPlot.id,
        chartConfig: newConfig,
      });
    },
    [plotDetails, dispatch]
  );
  const removePlot = useCallback(
    (id: string, newId?: string) => {
      dispatch({ type: "remove", id, newId });
    },
    [dispatch]
  );
  const setActiveLabel = useCallback(
    (plotId: string) => dispatch({ type: "select", id: plotId }),
    [dispatch]
  );

  return {
    plotDetails,
    selectedPlot,
    addPlot,
    editPlot,
    updateChartConfig,
    removePlot,
    plotTabLabels,
    renderLabel,
    setActiveLabel,
  };
};
