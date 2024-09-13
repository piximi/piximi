import React, { useEffect, useMemo } from "react";
import {
  selectMeasurementData,
  selectSelectedGroupMeasurements,
} from "store/measurements/selectors";
import { useDispatch, useSelector } from "react-redux";
import { MeasurementOptions, MeasurementGroup } from "store/measurements/types";
import { RecursivePartial } from "utils/common/types";
import { measurementsSlice } from "store/measurements/measurementsSlice";
import { SelectionTree } from "components/styled-components";
import { isObjectEmpty } from "utils/common/helpers";
import { xor } from "lodash";
import { Box } from "@mui/material";
import { selectTreeItemChildren } from "../utils";

export const MeasurementsTree = ({
  group,
  setLoading,
  loading,
}: {
  group: MeasurementGroup;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
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
    if (loading) return;

    const itemId = xor(itemIds, selectedMeasurements)[0];
    const updates: RecursivePartial<MeasurementOptions> = {};
    const updatedSelectionStatus = selectedMeasurements.includes(itemId)
      ? "off"
      : "on";
    selectTreeItemChildren(
      updates,
      itemId,
      group.measurementsStatus,
      updatedSelectionStatus
    );

    const activeMeasurements = prepareActiveMeasurements(updates);

    if (window.Worker) {
      setLoading(true);
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
        e: MessageEvent<Record<string, Record<string, number>>>
      ) => {
        setLoading(false);
        if (!isObjectEmpty(e.data)) {
          dispatch(
            measurementsSlice.actions.updateMeasurements({
              measurementsDict: e.data,
            })
          );
        }
      };
    }
  }, [measurementWorker, dispatch, setLoading]);

  return (
    <Box>
      <SelectionTree
        treeItems={group.measurementsStatus}
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
