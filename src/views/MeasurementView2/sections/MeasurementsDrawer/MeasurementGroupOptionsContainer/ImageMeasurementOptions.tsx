import { useEffect, useMemo, useRef } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { Box } from "@mui/material";

import { useScheduler, useSchedulerProgress } from "contexts";
import { DividerWithLoading } from "components/ui";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { channelMeasurementLabel2Values } from "views/MeasurementView2/utils";
import { measurementsSlice } from "../../../state/redux/measurementsSlice";
import { ComputedImageMeasurementOptions } from "./ComputedImageMeasurements";
import { IntensityMeasurementOptions } from "./IntensityMeasurementOptions";
import { ImageMeasurementGroup } from "../../../types";

import { dataSlice } from "store/data";
import { CHANNEL_MEASUREMENT_KEYS } from "store/data/consts";
import { selectImageDataEntities } from "store/data/selectors";
import {
  ChannelData,
  ChannelMeasurements,
  ComputedImageMeasurements,
  ImageMeasurements,
  ImageObject,
} from "store/data/types";

import { LoadStatus } from "utils/types";
import { isObjectEmpty } from "utils/objectUtils";

import { TaskPriority, TaskHandle } from "workers/scheduler";

type MeasurementResult = { imageId: string; measurements: ImageMeasurements }[];

export const ImageMeasurementOptions = ({
  group,
}: {
  group: ImageMeasurementGroup;
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
  const images = useSelector(selectImageDataEntities);

  const taskHandleRef = useRef<TaskHandle<
    MeasurementResult | Record<string, Record<number, ChannelData>>
  > | null>(null);

  const measurementEntities = useMemo(() => {
    const measurementEntities = group.entityIds.reduce(
      (entities: Record<string, ImageObject>, id) => {
        entities[id] = images[id];
        return entities;
      },
      {},
    );

    return measurementEntities;
  }, [images, group.entityIds]);

  const dispatchComputedMeasurementWorker = (itemIds: string[]) => {
    const handle = scheduler.dispatch<MeasurementResult>({
      type: "imageMeasurements",
      payload: {
        annotations: measurementEntities,
        selectedMeasurements: itemIds as (keyof ComputedImageMeasurements)[],
      },
      priority: TaskPriority.HIGH,

      onComplete: (data) => {
        if (!isObjectEmpty(data)) {
          console.log(data);
          batch(() => {
            dispatch(
              measurementsSlice.actions.addImageComputedMeasurements({
                groupId: group.id,
                measurements: itemIds as (keyof ComputedImageMeasurements)[],
              }),
            );
            dispatch(
              dataSlice.actions.batchUpdateImageComputedMeasurements(data),
            );
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
    console.log(measurementEntities);

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
          console.log(data);
          batch(() => {
            dispatch(
              measurementsSlice.actions.addIntensityMeasurements({
                groupId: group.id,
                measurements: itemIds,
              }),
            );
            dispatch(
              dataSlice.actions.updateImageChannelMeasurementValues(data),
            );
          });
        }
      },
      onError: (_error) => {},
    });

    taskHandleRef.current = handle;
  };
  useEffect(() => {
    console.log(loadStatus);
    console.log(schedulerProgress);
  });

  useEffect(() => console.log("mounted"), []);
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
      <ComputedImageMeasurementOptions
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
