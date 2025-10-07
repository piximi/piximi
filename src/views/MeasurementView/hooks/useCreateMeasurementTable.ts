import { useCallback, useMemo, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { wrap, proxy } from "comlink";
import {
  selectCategoriesByKind,
  selectKindDictionary,
  selectThingsDictionary,
} from "store/data/selectors";
import { LoadStatus } from "utils/types";
import { DataArray } from "store/data/types";
import { ThingData } from "store/measurements/types";
import { useDialogHotkey } from "hooks";
import { HotkeyContext } from "utils/enums";
import { measurementsSlice } from "store/measurements";

const NUM_WORKERS = 4;
// Type definition for the worker API
type PrepareDataWorkerAPI = {
  processPrepareData: (
    kind: string,
    things: {
      id: string;
      kind: string;
      data: number[][][][];
      encodedMask?: number[];
      decodedMask?: DataArray;
    }[],
    onProgress?: (progress: number) => void,
  ) => Promise<{ kind: string; data: ThingData }>;
};

export const useCreateMeasurementTable = () => {
  const categoriesByKind = useSelector(selectCategoriesByKind);
  const kinds = useSelector(selectKindDictionary);
  const thingData = useSelector(selectThingsDictionary);
  const dispatch = useDispatch();
  const [status, setStatus] = useState<LoadStatus>({ loading: false });

  // Create and wrap multiple workers with Comlink
  const workerApis = useMemo(() => {
    return Array.from({ length: NUM_WORKERS }, () => {
      const worker = new Worker(
        new URL("../workers/prepareDataWorker.ts", import.meta.url),
        { type: "module" },
      );
      return wrap<PrepareDataWorkerAPI>(worker);
    });
  }, []);

  const kindOptions = useMemo(
    () =>
      Object.values(kinds).reduce(
        (optionsArray: { kindId: string; displayName: string }[], kind) => {
          optionsArray.push({ kindId: kind.id, displayName: kind.displayName });
          return optionsArray;
        },
        [],
      ),
    [kinds],
  );

  const {
    onClose: handleCloseTableDialog,
    onOpen: handleOpenTableDialog,
    open: isTableDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleCreateTable = useCallback(
    async (kind: string) => {
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
          const dataArray = thing.data.arraySync();
          return {
            id: thing.id,
            kind: kind,
            data: dataArray,
            encodedMask: thing.encodedMask,
            decodedMask: thing.decodedMask,
          };
        } else {
          const dataArray = thing.data.arraySync();
          return { id: thing.id, kind: kind, data: dataArray };
        }
      });

      if (window.Worker) {
        setStatus({ loading: true });

        try {
          // Split data into chunks for parallel processing
          const chunkSize = Math.ceil(convertedThingData.length / NUM_WORKERS);
          const chunks = Array.from({ length: NUM_WORKERS }, (_, i) => {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, convertedThingData.length);
            return convertedThingData.slice(start, end);
          }).filter((chunk) => chunk.length > 0); // Remove empty chunks

          // Track progress from each worker
          const progressTrackers = new Array(chunks.length).fill(0);
          const updateProgress = () => {
            const avgProgress =
              progressTrackers.reduce((sum, p) => sum + p, 0) /
              progressTrackers.length;
            const newStatus = Math.floor(avgProgress);
            setStatus((prev) => {
              if (prev.value !== newStatus) {
                return { loading: true, value: newStatus };
              }
              return prev;
            });
          };

          // Process chunks in parallel
          const results = await Promise.all(
            chunks.map((chunk, index) =>
              workerApis[index].processPrepareData(
                kind,
                chunk,
                proxy((progress: number) => {
                  progressTrackers[index] = progress;
                  updateProgress();
                }),
              ),
            ),
          );

          // Merge results from all workers
          const mergedData: ThingData = {};
          results.forEach((result) => {
            Object.assign(mergedData, result.data);
          });

          // Process the merged result
          const numChannels = Object.values(mergedData)[0].channels.length;
          batch(() => {
            dispatch(
              measurementsSlice.actions.createGroup({
                kindId: kind,
                displayName: kinds[kind].displayName,
                categories: categoriesByKind(kind),
                thingIds: Object.keys(mergedData),
                numChannels,
              }),
            );
            dispatch(
              measurementsSlice.actions.updateMeasurements({
                dataDict: mergedData,
              }),
            );
          });
          setStatus({ loading: false });
        } catch (error) {
          console.error("Error processing measurement table:", error);
          setStatus({ loading: false });
        }
      }
    },
    [workerApis, kinds, thingData, dispatch, categoriesByKind],
  );

  return {
    status,
    handleOpenTableDialog,
    handleCloseTableDialog,
    isTableDialogOpen,
    handleCreateTable,
    kindOptions,
  };
};
