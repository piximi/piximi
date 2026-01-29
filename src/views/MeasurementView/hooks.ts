import { useCallback, useMemo, useRef, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import saveAs from "file-saver";
import { DataArray } from "image-js";

import { useDialogHotkey } from "hooks";

import { useScheduler } from "contexts";
import { decodeAnnotation } from "views/ImageViewer/utils/rle";
import { PreparedEntityChannels } from "./types";
import { selectActiveMeasurementGroup } from "./state/redux/selectors";
import { measurementsSlice } from "./state/redux/measurementsSlice";
import { selectActiveMeasuredEntities } from "./state/redux/reselectors";

import { dataSlice } from "store/data";
import { IMAGE_KIND } from "store/data/constants";
import {
  selectCategoryEntities,
  selectKindEntities,
  selectImageDataEntities,
  selectAnnotationEntities,
  selectKindToAnnotations,
} from "store/data/selectors";
import { AnnotationObject, ChannelData, ImageObject } from "store/data/types";

import { HotkeyContext } from "utils/enums";
import { LoadStatus, Point } from "utils/types";
import { isObjectEmpty } from "utils/objectUtils";

import { TaskPriority, TaskHandle } from "workers/scheduler";
import { capitalize } from "utils/stringUtils";

export const useTableExport = () => {
  const activeGroup = useSelector(selectActiveMeasurementGroup);
  const activeMeasuredEntities = useSelector(selectActiveMeasuredEntities);
  const images = useSelector(selectImageDataEntities);
  const categories = useSelector(selectCategoryEntities);

  const handleExportTable = useCallback(() => {
    if (!activeGroup) return;
    const exportData: Record<string, number | string>[] = [];
    Object.values(activeMeasuredEntities).forEach(
      (entity: ImageObject | AnnotationObject) => {
        const data: Record<string, number | string> = {
          id: entity.id,
          name: entity.name,
          kind: "kind" in entity ? entity.kind : IMAGE_KIND,
          category: categories[entity.categoryId].name,
          partition: entity.partition,
        };
        if ("kind" in entity) {
          data.imageName = images[entity.imageId].name;
          data["bbox [x1:y1:x2:y2]"] = `[${entity.boundingBox.join(":")}]`;
        }
        data.timepoint = entity.timepoint ?? "N/A";
        let hasChannelMeasurements = false;
        if (entity.measurements) {
          Object.entries(entity.measurements).forEach(
            ([measurement, value]) => {
              if (measurement === "channels" && Array.isArray(value)) {
                if (value.length > 0) hasChannelMeasurements = true;
                return;
              }
              if (typeof value === "number") data[measurement] = value;
              if (measurement === "com") {
                data["com [x:y]"] =
                  `[${(value as Point).x}:${(value as Point).y}]`;
              }
            },
          );
        }
        if (hasChannelMeasurements) {
          const channelMeasurements = entity.measurements!.channels;
          channelMeasurements.forEach((channel) => {
            const labelPrefix = `-Intensity-Channel_${channel.channelId}`;
            Object.entries(channel).forEach(([measurement, value]) => {
              if (
                measurement === "channelId" ||
                measurement === "channelData" ||
                measurement === "histogram"
              )
                return;
              if (Array.isArray(value)) return;
              data[capitalize(measurement) + labelPrefix] = value;
            });
          });
        }
        exportData.push(data);
      },
    );
    if (isObjectEmpty(exportData)) return;
    const refined: string[] = [];
    refined.push(Object.keys(exportData[0]).join(","));
    exportData.forEach((row) => {
      refined.push(Object.values(row).join(","));
    });
    const csvContent = refined.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8," });
    const objUrl = URL.createObjectURL(blob);
    saveAs(objUrl, `${activeGroup.name.replaceAll(" ", "-")}.csv`);
    URL.revokeObjectURL(objUrl);
  }, [activeGroup, activeMeasuredEntities, categories, images]);

  return handleExportTable;
};

export const useCreateMeasurementTable = () => {
  const annotationsByKind = useSelector(selectKindToAnnotations);
  const kinds = useSelector(selectKindEntities);
  const images = useSelector(selectImageDataEntities);
  const annotations = useSelector(selectAnnotationEntities);
  const dispatch = useDispatch();
  const [status, setStatus] = useState<LoadStatus>({ loading: false });

  const scheduler = useScheduler();
  const taskHandleRef = useRef<TaskHandle<{
    kind: string;
    data: PreparedEntityChannels;
  }> | null>(null);

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

  const createTransferableEntities = (kind: string) => {
    let transferableEntities: {
      id: string;
      kind: string;
      data: number[][][][];
      encodedMask?: number[];
      decodedMask?: DataArray;
    }[];

    if (kind === IMAGE_KIND)
      transferableEntities = Object.values(images).map((image) => ({
        id: image.id,
        kind: IMAGE_KIND,
        data: image.data.arraySync(),
      }));
    else {
      transferableEntities = annotationsByKind[kind].map((annId) => {
        const annotation = annotations[annId];
        let decodedMask: DataArray | undefined = undefined;
        if (!annotation.decodedMask)
          decodedMask = decodeAnnotation(annotation).decodedMask;
        return {
          id: annId,
          kind: annotation.kind,
          data: annotation.data.arraySync(),
          encodedMask: annotation.encodedMask,
          decodedMask: decodedMask ? decodedMask : annotation.decodedMask,
        };
      });
    }
    return transferableEntities;
  };

  const handleCreateTable = async (kind: string) => {
    const transferableEntities = createTransferableEntities(kind);

    setStatus({ loading: true });

    const handle = scheduler.dispatch<{
      kind: string;
      data: PreparedEntityChannels;
    }>({
      type: "prepare",
      payload: {
        kind,
        entities: transferableEntities,
      },
      priority: TaskPriority.HIGH,
      onProgress: (progress: number) => {
        setStatus({ loading: true, value: progress });
      },
      onComplete: (result) => {
        if (result.data && result.kind) {
          const measurementUpdates = Object.entries(result.data).map(
            ([id, channels]) => {
              return {
                id,
                channelMeasurements: channels.map(
                  (channelData: number[], idx: number) => ({
                    channelId: idx + "",
                    channelData,
                  }),
                ) as ChannelData[],
              };
            },
          );

          // Dispatch to the correct entity type based on kind
          const batchAction =
            result.kind === IMAGE_KIND
              ? dataSlice.actions.batchUpdateImageChannelMeasurements
              : dataSlice.actions.batchUpdateAnnotationChannelMeasurements;

          // Batch all dispatches to prevent multiple re-renders
          batch(() => {
            dispatch(batchAction(measurementUpdates));

            dispatch(
              measurementsSlice.actions.createGroup({
                kindId: result.kind,
                displayName: kinds[result.kind].displayName,
                itemIds: Object.keys(result.data),
              }),
            );
          });

          setStatus({ loading: false });
        }
      },
      onError: (error) => {
        if (error.code !== "CANCELLED") {
          setStatus({ loading: false, message: error.message });
        } else {
          setStatus({ loading: false });
        }
      },
    });

    taskHandleRef.current = handle;
  };

  const handleCancelTask = useCallback(() => {
    if (taskHandleRef.current) {
      taskHandleRef.current.cancel();
      taskHandleRef.current = null;
      setStatus({ loading: false });
    }
  }, []);

  return {
    status,
    handleOpenTableDialog,
    handleCloseTableDialog,
    isTableDialogOpen,
    handleCreateTable,
    handleCancelTask,
    kindOptions,
  };
};
