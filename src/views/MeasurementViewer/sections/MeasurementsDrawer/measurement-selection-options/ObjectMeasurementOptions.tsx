import { useMemo, useRef } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import { Box } from "@mui/material";

import { TaskPriority } from "workers/scheduler";
import type { TaskHandle } from "workers/scheduler";

import { DividerWithLoading } from "components/ui";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useScheduler, useSchedulerProgress } from "contexts";
import { parseChannelMeasurementLabel } from "@MeasurementViewer/utils";
import { dataSlice } from "store/data";
import { CHANNEL_MEASUREMENT_KEYS } from "store/data/consts";
import { selectAnnotationEntities } from "store/data/selectors";
import type {
  AnnotationObject,
  ChannelMeasurements,
  ComputedObjectMeasurements,
} from "store/data/types";
import { hasTensorReference } from "store/data/utils";
import { measurementsSlice } from "@MeasurementViewer/state";

import { isObjectEmpty } from "utils/objectUtils";
import type { LoadStatus } from "utils/types";

import { IntensityMeasurementOptions } from "./IntensityMeasurementOptions";
import { ComputedObjectMeasurementOptions } from "./ComputedObjectMeasurements";
import { TrackMeasurementOptions } from "./TrackMeasurementOptions";

import type { ObjectMeasurementGroup } from "@MeasurementViewer/types";
import type { TensorReference } from "services";

type ComputedMeasurementResult = {
  id: string;
  measurements: ComputedObjectMeasurements;
}[];
type ChannelMeasurementResult = {
  id: string;
  channelMeasurements: {
    channelId: string;
    measurements: ChannelMeasurements;
  }[];
}[];

export const ObjectMeasurementOptions = ({
  group,
}: {
  group: ObjectMeasurementGroup;
}) => {
  const dispatch = useDispatch();
  const scheduler = useScheduler();
  const schedulerProgress = useSchedulerProgress();
  const loadStatus = useMemo<LoadStatus>(
    () => ({
      loading: schedulerProgress.pending + schedulerProgress.running > 0,
      value: schedulerProgress.overallPercent,
    }),
    [schedulerProgress],
  );
  const annotations = useSelector(selectAnnotationEntities);

  const taskHandleRef = useRef<TaskHandle<
    ComputedMeasurementResult | ChannelMeasurementResult
  > | null>(null);

  const measurementEntities = useMemo(() => {
    const measurementEntities = group.entityIds.reduce(
      (
        entities: Record<
          string,
          AnnotationObject & { tensorRef: TensorReference }
        >,
        id,
      ) => {
        const annotation = annotations[id];
        if (hasTensorReference(annotation)) entities[id] = annotation;
        return entities;
      },
      {},
    );

    return measurementEntities;
  }, [annotations, group.entityIds]);

  const dispatchComputedMeasurementWorker = (itemIds: string[]) => {
    console.log(itemIds);
    const handle = scheduler.dispatch({
      type: "annotationMeasurements",
      payload: {
        annotations: measurementEntities,
        selectedMeasurements: itemIds as (keyof ComputedObjectMeasurements)[],
      },
      priority: TaskPriority.HIGH,

      onComplete: (data) => {
        console.log(data);
        if (!isObjectEmpty(data)) {
          batch(() => {
            dispatch(
              measurementsSlice.actions.addObjectComputedMeasurements({
                groupId: group.id,
                measurements: itemIds as (keyof ComputedObjectMeasurements)[],
              }),
            );
            dispatch(dataSlice.actions.batchUpdateAnnotationMeasurements(data));
          });
        }
      },
      onError: (_error) => {},
    });

    taskHandleRef.current = handle;
  };
  const dispatchIntensityMeasurementWorker = (itemIds: string[]) => {
    const sanitizedMeasurements = itemIds.filter(
      (msrmnt) => !["intensity", ...CHANNEL_MEASUREMENT_KEYS].includes(msrmnt),
    );

    const measurementsPayload = sanitizedMeasurements.map((msrmnt) => {
      return parseChannelMeasurementLabel(msrmnt);
    });

    const handle = scheduler.dispatch({
      type: "channelMeasurements",
      payload: {
        entities: Object.values(measurementEntities),
        measurements: measurementsPayload,
      },
      priority: TaskPriority.HIGH,

      onComplete: (data) => {
        if (!isObjectEmpty(data)) {
          batch(() => {
            dispatch(
              measurementsSlice.actions.addIntensityMeasurements({
                groupId: group.id,
                measurements: itemIds,
              }),
            );
            dispatch(
              dataSlice.actions.batchUpdateAnnotationChannelMeasurements(data),
            );
          });
        }
      },
      onError: (_error) => {},
    });

    taskHandleRef.current = handle;
  };

  return (
    <Box
      sx={{
        mx: 1,
      }}
    >
      <DividerWithLoading
        data-help={HelpItem.MeasurementsTree}
        title="Measurements"
        loadStatus={loadStatus}
      />
      <ComputedObjectMeasurementOptions
        group={group}
        onSelect={dispatchComputedMeasurementWorker}
      />
      <IntensityMeasurementOptions
        group={group}
        onSelect={dispatchIntensityMeasurementWorker}
      />
      <TrackMeasurementOptions
        group={group}
        onSelect={dispatchIntensityMeasurementWorker}
      />
    </Box>
  );
};
