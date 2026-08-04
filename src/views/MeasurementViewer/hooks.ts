import { useCallback, useMemo, useRef, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { saveAs } from "file-saver";

import { useDialogHotkey } from "hooks";

import type { TaskHandle } from "workers/scheduler";
import { TaskPriority } from "workers/scheduler";
import type { PreparedEntityChannels } from "workers/tasks/types";

import { useScheduler } from "contexts";
import { IMAGE_KIND } from "store/data/constants";
import {
  selectCategoryEntities,
  selectKindEntities,
  selectImageDataEntities,
  selectAnnotationEntities,
  selectKindToAnnotations,
} from "store/data/selectors";
import type {
  AnnotationObject,
  DataArray,
  ImageObject,
} from "store/data/types";
import { decodeAnnotation, hasTensorReference } from "store/data/utils";

import { HotkeyContext } from "utils/enums";
import type { LoadStatus, Point } from "utils/types";
import { isObjectEmpty } from "utils/objectUtils";
import { formatString } from "utils/stringUtils";

import { selectActiveMeasurementGroup } from "./state/selectors";
import { measurementsSlice } from "./state/measurementsSlice";
import { selectActiveMeasuredEntities } from "./state/reselectors";
import type { PipelineProgress } from "services";

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
        Object.entries(entity.measurements.computed).forEach(
          ([measurement, value]) => {
            if (typeof value === "number") data[measurement] = value;
            if (measurement === "com") {
              data["com [x:y]"] =
                `[${(value as Point).x}:${(value as Point).y}]`;
            }
          },
        );

        const channelMeasurements = entity.measurements.channel;
        Object.entries(channelMeasurements).forEach(
          ([channelId, measurements]) => {
            const labelPrefix = `-Intensity-Channel_${channelId}`;
            Object.entries(measurements).forEach(([measurement, value]) => {
              data[
                formatString(measurement, undefined, "every-word") + labelPrefix
              ] = value;
            });
          },
        );

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
    const transferableEntities: {
      id: string;
      kind: string;
      data: number[][][][];
      encodedMask?: number[];
      decodedMask?: DataArray;
    }[] = [];
    const prepared: string[] = [];

    if (kind === IMAGE_KIND)
      Object.values(images).forEach((image) => {
        if (!hasTensorReference(image)) {
          transferableEntities.push({
            id: image.id,
            kind: IMAGE_KIND,
            data: image.data.arraySync(),
          });
        } else {
          prepared.push(image.id);
        }
      });
    else {
      annotationsByKind[kind].map((annId) => {
        const annotation = annotations[annId];
        if (!hasTensorReference(annotation)) {
          let decodedMask: DataArray | undefined = undefined;
          if (!annotation.decodedMask)
            decodedMask = decodeAnnotation(annotation).decodedMask;
          transferableEntities.push({
            id: annId,
            kind: annotation.kind,
            data: annotation.data.arraySync(),
            encodedMask: annotation.encodedMask,
            decodedMask: decodedMask ? decodedMask : annotation.decodedMask,
          });
        } else {
          prepared.push(annId);
        }
      });
    }
    return { unprepared: transferableEntities, prepared };
  };

  const handleCreateTable = async (kind: string) => {
    const transferableEntities = createTransferableEntities(kind);

    setStatus({ loading: true });
    const newlyPrepared: string[] = [];
    const handle = scheduler.dispatch({
      type: "prepare",
      payload: {
        kind,
        entities: transferableEntities.unprepared,
      },
      priority: TaskPriority.HIGH,
      onProgress: (progress: number | Partial<PipelineProgress>) => {
        setStatus({ loading: true, value: progress as number });
      },
      onComplete: (result) => {
        if (result.data && result.kind) {
          newlyPrepared.push(...Object.keys(result.data));

          setStatus({ loading: false });
        }
        dispatch(
          measurementsSlice.actions.createGroup({
            kindId: result.kind,
            displayName: kinds[result.kind].displayName,
            itemIds: [...transferableEntities.prepared, ...newlyPrepared],
          }),
        );
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
