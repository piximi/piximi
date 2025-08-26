import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { xor } from "lodash";
import { Box } from "@mui/material";

import { SelectionTree } from "components/ui/SelectionTree";

import { measurementsSlice } from "store/measurements";
import {
  selectMeasurementData,
  selectSelectedGroupMeasurements,
} from "store/measurements/selectors";

import { isObjectEmpty } from "utils/objectUtils";
import { selectTreeItemChildren } from "../../utils";

import { LoadStatus, RecursivePartial } from "utils/types";
import { MeasurementOptions, MeasurementGroup } from "store/measurements/types";
import * as Comlink from "comlink";

export const MeasurementsTree = ({
  group,
  setMeasurementStatus,
  measurementStatus,
}: {
  group: MeasurementGroup;
  setMeasurementStatus: React.Dispatch<React.SetStateAction<LoadStatus>>;
  measurementStatus: LoadStatus;
}) => {
  const dispatch = useDispatch();
  const selectedMeasurements = useSelector(selectSelectedGroupMeasurements)(
    group.id
  );
  const measurementData = useSelector(selectMeasurementData);

  const measurementWorker = useMemo(() => {
    const worker = new Worker(
      new URL("../../workers/globalWorker.ts", import.meta.url),
      { type: "module" }
    );
    return Comlink.wrap(worker) as any;
  }, []);

  const handleSelect = async (
    event: React.SyntheticEvent,
    itemIds: string[]
  ) => {
    if (measurementStatus.loading) return;

    const itemId = xor(itemIds, selectedMeasurements)[0];
    const updates: RecursivePartial<MeasurementOptions> = {};
    const updatedSelectionState = selectedMeasurements.includes(itemId)
      ? "off"
      : "on";
    selectTreeItemChildren(
      updates,
      itemId,
      group.measurementStates,
      updatedSelectionState
    );

    const activeMeasurements = prepareActiveMeasurements(updates);

    // if (window.Worker) {
    //   console.log("post message");
    //   setMeasurementStatus({ loading: true });
    //   measurementWorker.postMessage({
    //     currentMeasurements: measurementData,
    //     activeMeasurements,
    //     thingIds: group.thingIds,
    //   });
    // }

    const progressCallback = Comlink.proxy((progress: number) => {
      setMeasurementStatus({ loading: true, value: progress });
    });

    const data: Record<
      string,
      Record<string, number>
    > = await measurementWorker.runMeasurement(
      {
        currentMeasurements: measurementData,
        activeMeasurements,
        thingIds: group.thingIds,
      },
      progressCallback
    );

    //   setMeasurementStatus({ loading: false });
    //   if (!isObjectEmpty(data)) {
    //     dispatch(
    //       measurementsSlice.actions.updateMeasurements({
    //         measurementsDict: data,
    //       })
    //     );
    //   }
    // );
    setMeasurementStatus({ loading: false });
    if (!isObjectEmpty(data)) {
      dispatch(
        measurementsSlice.actions.updateMeasurements({
          measurementsDict: data,
        })
      );
    }

    dispatch(
      measurementsSlice.actions.updateGroupMeasurementState({
        groupId: group.id,
        updates,
      })
    );
  };

  // useEffect(() => {
  //   if (window.Worker) {
  //     measurementWorker.onmessage = (
  //       e: MessageEvent<
  //         | { data: Record<string, Record<string, number>>; loadValue?: number }
  //         | { loadValue: number; data?: Record<string, Record<string, number>> }
  //       >
  //     ) => {
  //       if (e.data.loadValue) {
  //         setMeasurementStatus({ loading: true, value: e.data.loadValue });
  //       }
  //       if (e.data.data) {
  //         setMeasurementStatus({ loading: false });
  //         if (!isObjectEmpty(e.data.data)) {
  //           dispatch(
  //             measurementsSlice.actions.updateMeasurements({
  //               measurementsDict: e.data.data,
  //             })
  //           );
  //         }
  //       }
  //     };
  //   }
  // }, [measurementWorker, dispatch, setMeasurementStatus]);

  return (
    <Box>
      <SelectionTree
        treeItems={group.measurementStates}
        selectedItems={selectedMeasurements}
        handleSelect={handleSelect}
        checkboxSize="small"
      />
    </Box>
  );
};

const prepareActiveMeasurements = (
  updatedMeasurements: RecursivePartial<MeasurementOptions>
) => {
  const activeMeasurements = Object.entries(updatedMeasurements).reduce(
    (active: string[], measurement) => {
      if (!measurement[1]!.children && measurement[1]!.state === "on") {
        active.push(measurement[0]);
      }
      return active;
    },
    []
  );

  return activeMeasurements;
};
