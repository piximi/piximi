import { useMemo, useRef } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import { Box } from "@mui/material";

import type { TaskHandle } from "workers/scheduler";
import { TaskPriority } from "workers/scheduler";

import { DividerWithLoading } from "components/ui";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { useScheduler, useSchedulerProgress } from "contexts";
import { parseChannelMeasurementLabel } from "@MeasurementViewer/utils";
import { measurementsSlice } from "@MeasurementViewer/state";
import { dataSlice } from "store/data";
import { CHANNEL_MEASUREMENT_KEYS } from "store/data/consts";
import { selectImageDataEntities } from "store/data/selectors";
import type {
  ChannelMeasurements,
  ComputedImageMeasurements,
  ImageObject,
} from "store/data/types";
import { hasTensorReference } from "store/data/utils";

import type { LoadStatus } from "utils/types";
import { isObjectEmpty } from "utils/objectUtils";

import { ComputedImageMeasurementOptions } from "./ComputedImageMeasurements";
import { IntensityMeasurementOptions } from "./IntensityMeasurementOptions";

import type { ImageMeasurementGroup } from "@MeasurementViewer/types";
import type { TensorReference } from "services";

type ComputedMeasurementResult = {
  id: string;
  measurements: ComputedImageMeasurements;
}[];
type ChannelMeasurementResult = {
  id: string;
  channelMeasurements: {
    channelId: string;
    measurements: ChannelMeasurements;
  }[];
}[];

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
    ComputedMeasurementResult | ChannelMeasurementResult
  > | null>(null);

  const measurementEntities = useMemo(() => {
    const measurementEntities = group.entityIds.reduce(
      (
        entities: Record<string, ImageObject & { tensorRef: TensorReference }>,
        id,
      ) => {
        const image = images[id];
        if (hasTensorReference(image)) entities[id] = image;
        return entities;
      },
      {},
    );

    return measurementEntities;
  }, [images, group.entityIds]);

  const dispatchComputedMeasurementWorker = (itemIds: string[]) => {
    const handle = scheduler.dispatch({
      type: "imageMeasurements",
      payload: {
        images: Object.values(measurementEntities),
        selectedMeasurements: itemIds as (keyof ComputedImageMeasurements)[],
      },
      priority: TaskPriority.HIGH,

      onComplete: (data) => {
        if (!isObjectEmpty(data)) {
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
    // Since there are nested values in the TreeView cmponent
    // we cannot omit the values of "intensity" or "Channel 0|1|2" from being stored in redux
    // doing so would prevent the partial selection indicator in the checkboxes
    // from displaying correctly. Thats why sanitation happens here.
    // It seems counter-intuitive to filter values which exist in "CHANNELMEASUREMENT"
    console.log(itemIds);
    const sanitizedMeasurements = itemIds.filter(
      (msrmnt) => !["intensity", ...CHANNEL_MEASUREMENT_KEYS].includes(msrmnt),
    );
    console.log(sanitizedMeasurements);

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
        console.log(data);
        if (!isObjectEmpty(data)) {
          batch(() => {
            dispatch(
              measurementsSlice.actions.addIntensityMeasurements({
                groupId: group.id,
                measurements: itemIds,
              }),
            );
            dispatch(
              dataSlice.actions.batchUpdateImageChannelMeasurements(data),
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
