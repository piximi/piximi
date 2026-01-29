import { useMemo, useRef } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { Box } from "@mui/material";

import { useScheduler, useSchedulerProgress } from "contexts";
import { DividerWithLoading } from "components/ui";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { channelMeasurementLabel2Values } from "views/MeasurementView/utils";
import { measurementsSlice } from "../../../state/redux/measurementsSlice";
import { ComputedObjectMeasurementOptions } from "./ComputedObjectMeasurements";
import { IntensityMeasurementOptions } from "./IntensityMeasurementOptions";
import { ObjectMeasurementGroup, PreparedAnnotationData } from "../../../types";

import { dataSlice } from "store/data";
import { CHANNEL_MEASUREMENT_KEYS } from "store/data/consts";
import { selectAnnotationEntities } from "store/data/selectors";
import {
  ChannelData,
  ChannelMeasurements,
  ComputedObjectMeasurements,
  ObjectMeasurements,
} from "store/data/types";

import { LoadStatus } from "utils/types";
import { isObjectEmpty } from "utils/objectUtils";

import { TaskPriority, TaskHandle } from "workers/scheduler";

type MeasurementResult = { annId: string; measurements: ObjectMeasurements }[];

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
    MeasurementResult | Record<string, Record<number, ChannelData>>
  > | null>(null);

  const measurementEntities = useMemo(() => {
    const measurementEntities = group.entityIds.reduce(
      (entities: Record<string, PreparedAnnotationData>, id) => {
        entities[id] = annotations[id];
        return entities;
      },
      {},
    );

    return measurementEntities;
  }, [annotations, group.entityIds]);

  const dispatchComputedMeasurementWorker = (itemIds: string[]) => {
    const handle = scheduler.dispatch<MeasurementResult>({
      type: "annotationMeasurements",
      payload: {
        annotations: measurementEntities,
        selectedMeasurements: itemIds as (keyof ObjectMeasurements)[],
      },
      priority: TaskPriority.HIGH,

      onComplete: (data) => {
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

    const groupedMeasurements: Partial<
      Record<keyof ChannelMeasurements, number[]>
    > = {};
    sanitizedMeasurements.forEach((msrmnt) => {
      const { channelId, measurement } = channelMeasurementLabel2Values(msrmnt);
      if (measurement in groupedMeasurements)
        groupedMeasurements[measurement]!.push(channelId);
      else groupedMeasurements[measurement] = [channelId];
    });

    const handle = scheduler.dispatch<
      Record<string, Record<number, ChannelData>>
    >({
      type: "channelMeasurements",
      payload: {
        entities: Object.values(measurementEntities),
        measurements: groupedMeasurements,
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
              dataSlice.actions.updateAnnotationChannelMeasurementValues(data),
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
    </Box>
  );
};
