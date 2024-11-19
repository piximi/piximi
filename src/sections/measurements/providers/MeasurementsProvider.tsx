import React, {
  createContext,
  ReactNode,
  useEffect,
  useReducer,
  useState,
} from "react";

import { GroupedMeasurementDisplayTable } from "store/measurements/types";

import {
  MeasurementDisplayParameters,
  PlotDetails,
  PlotViewActionProps,
  ViewReducer,
} from "../types";
import { formatChartItems } from "../utils";
import { plotViewReducer } from "./reducers";
import { initialPlotView } from "./initialStates";

export const MeasurementsContext =
  createContext<null | MeasurementDisplayParameters>(null);
export const PlotViewContext = createContext<null | {
  plotDetails: PlotDetails;
  dispatch: React.Dispatch<PlotViewActionProps>;
}>(null);

export const MeasurementsProvider = ({
  children,
  measurementGroup,
}: {
  children: ReactNode;
  measurementGroup: GroupedMeasurementDisplayTable;
}) => {
  const [plotDetails, dispatch] = useReducer<ViewReducer>(
    plotViewReducer,
    initialPlotView
  );
  const [measurementParameters, setMeasurementParameters] =
    useState<MeasurementDisplayParameters>({
      measurementPlotOptions: {},

      groupThingIds: [],
    });

  useEffect(() => {
    setMeasurementParameters((measurementParameters) => {
      const measurementPlotOptions = formatChartItems(
        measurementGroup.measurements
      );
      return { ...measurementParameters, measurementPlotOptions };
    });
  }, [measurementGroup.measurements]);
  useEffect(() => {
    setMeasurementParameters((measurementParameters) => {
      return {
        ...measurementParameters,
        groupThingIds: measurementGroup.thingIds,
      };
    });
  }, [measurementGroup.thingIds]);

  return (
    <MeasurementsContext.Provider value={measurementParameters}>
      <PlotViewContext.Provider value={{ plotDetails, dispatch }}>
        {children}
      </PlotViewContext.Provider>
    </MeasurementsContext.Provider>
  );
};
