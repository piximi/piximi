import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { xor } from "lodash";
import { Box } from "@mui/material";

import { SelectionTree } from "components/SelectionTree";

import {
  selectMeasurementData,
  selectSelectedGroupMeasurements,
} from "store/measurements/selectors";
import { MeasurementOptions, MeasurementGroup } from "store/measurements/types";
import { measurementsSlice } from "store/measurements/measurementsSlice";

import { selectTreeItemChildren } from "../utils";
import { LoadStatus, RecursivePartial } from "utils/common/types";
import { isObjectEmpty } from "utils/common/helpers";

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
  const measurementWorker: Worker = useMemo(
    () =>
      new Worker(new URL("../workers/measurementWorker.ts", import.meta.url)),
    []
  );

  const handleSelect = (event: React.SyntheticEvent, itemIds: string[]) => {
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

    if (window.Worker) {
      setMeasurementStatus({ loading: true });
      measurementWorker.postMessage({
        currentMeasurements: measurementData,
        activeMeasurements,
        thingIds: group.thingIds,
      });
    }
    dispatch(
      measurementsSlice.actions.updateGroupMeasurementState({
        groupId: group.id,
        updates,
      })
    );
  };

  useEffect(() => {
    if (window.Worker) {
      measurementWorker.onmessage = (
        e: MessageEvent<
          | { data: Record<string, Record<string, number>>; loadValue?: number }
          | { loadValue: number; data?: Record<string, Record<string, number>> }
        >
      ) => {
        if (e.data.loadValue) {
          setMeasurementStatus({ loading: true, value: e.data.loadValue });
        }
        if (e.data.data) {
          setMeasurementStatus({ loading: false });
          if (!isObjectEmpty(e.data.data)) {
            dispatch(
              measurementsSlice.actions.updateMeasurements({
                measurementsDict: e.data.data,
              })
            );
          }
        }
      };
    }
  }, [measurementWorker, dispatch, setMeasurementStatus]);

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
