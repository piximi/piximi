import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import saveAs from "file-saver";
import { DataArray } from "image-js";

import { useDialogHotkey } from "hooks";

import {
  MeasurementsContext,
  PlotViewContext,
} from "./providers/MeasurementsProvider";
import { measurementsSlice } from "store/measurements";
import { selectMeasurementData } from "store/measurements/selectors";
import {
  selectCategoriesByKind,
  selectCategoriesDictionary,
  selectKindDictionary,
  selectThingsDictionary,
} from "store/data/selectors";

import { HotkeyContext } from "utils/common/enums";

import { MeasurementGroup, ThingData } from "store/measurements/types";
import { LoadStatus } from "utils/common/types";
import { ChartConfig } from "./types";

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

export const useTableExport = () => {
  const measurementData = useSelector(selectMeasurementData);
  const thingDetails = useSelector(selectThingsDictionary);
  const categories = useSelector(selectCategoriesDictionary);

  const handleExportTable = useCallback(
    (table: MeasurementGroup) => {
      const thingIds = table.thingIds;
      const exportData: Record<string, number | string>[] = [];
      thingIds.forEach((thingId) => {
        const thing = thingDetails[thingId]!;
        const data: Record<string, number | string> = { id: thingId };
        data.name = thing.name;
        data.kind = thing.kind;
        if ("imageId" in thing) {
          data.imageName = thingDetails[thing.imageId]!.name;
          data["bbox [x1:y1:x2:y2]"] = `[${thing.boundingBox.join(":")}]`;
        }
        data.category = categories[thing.categoryId]!.name;
        data.partition = thing.partition;
        Object.assign(data, measurementData[thingId].measurements);
        exportData.push(data);
      });
      const refined: string[] = [];
      refined.push(Object.keys(exportData[0]).join(","));
      exportData.forEach((row) => {
        refined.push(Object.values(row).join(","));
      });
      const csvContent = refined.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8," });
      const objUrl = URL.createObjectURL(blob);
      saveAs(objUrl, `${table.kind}-measurements.csv`);
    },
    [categories, measurementData, thingDetails]
  );

  return handleExportTable;
};

export const useCreateMeasurementTable = () => {
  const categoriesByKind = useSelector(selectCategoriesByKind);
  const kinds = useSelector(selectKindDictionary);
  const thingData = useSelector(selectThingsDictionary);
  const dispatch = useDispatch();
  const [status, setStatus] = useState<LoadStatus>({ loading: false });
  const worker: Worker = useMemo(
    () =>
      new Worker(new URL("./workers/prepareDataWorker.ts", import.meta.url)),
    []
  );
  const kindOptions = useMemo(() => Object.keys(kinds), [kinds]);
  const {
    onClose: handleCloseTableDialog,
    onOpen: handleOpenTableDialog,
    open: isTableDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleCreateTable = (kind: string) => {
    const thingIds = kinds[kind]!.containing;
    const convertedThingData: {
      id: string;
      kind: string;
      data: number[][][][];
      encodedMask?: number[];
      decodedMask?: DataArray;
    }[] = thingIds.map((thingId) => {
      const thing = thingData[thingId]!;
      if ("encodedMask" in thing) {
        return {
          id: thing.id,
          kind: kind,
          data: thing.data.arraySync(),
          encodedMask: thing.encodedMask,
          decodedMask: thing.decodedMask,
        };
      } else {
        return { id: thing.id, kind: kind, data: thing.data.arraySync() };
      }
    });

    if (window.Worker) {
      setStatus({ loading: true });
      worker.postMessage({ kind: kind, things: convertedThingData });
    }
  };

  useEffect(() => {
    if (window.Worker) {
      worker.onmessage = (
        e: MessageEvent<
          | {
              kind: string;
              data: ThingData;
              loadValue?: number;
            }
          | { loadValue: number; kind?: string; data?: ThingData }
        >
      ) => {
        if (e.data.loadValue) {
          setStatus({ loading: true, value: e.data.loadValue });
        }
        if (e.data.data && e.data.kind) {
          const numChannels = Object.values(e.data.data)[0].channels.length;
          batch(() => {
            dispatch(
              measurementsSlice.actions.createGroup({
                kind: e.data.kind!,
                categories: categoriesByKind(e.data.kind!),
                thingIds: Object.keys(e.data.data!),
                numChannels,
              })
            );
            dispatch(
              measurementsSlice.actions.updateMeasurements({
                dataDict: e.data.data,
              })
            );
          });
          setStatus({ loading: false });
        }
      };
    }
  }, [worker, dispatch, categoriesByKind]);

  return {
    status,
    handleOpenTableDialog,
    handleCloseTableDialog,
    isTableDialogOpen,
    handleCreateTable,
    kindOptions,
  };
};
