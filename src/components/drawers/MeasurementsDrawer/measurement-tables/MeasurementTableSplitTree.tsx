import { SelectionTree } from "components/styled-components";
import { intersection } from "lodash";
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectThingsDictionary } from "store/data/selectors";
import { AnnotationObject, ImageObject } from "store/data/types";
import { measurementsSlice } from "store/measurements/measurementsSlice";
import {
  selectMeasurementData,
  selectSelectedTableSplits,
} from "store/measurements/selectors";
import { SelectionTreeItems, MeasurementTable } from "store/measurements/types";
import { isObjectEmpty, selectTreeItemChildren } from "utils/common/helpers";
import { RecursivePartial } from "utils/common/types";

export const MeasurementTableSplitTree = ({
  table,
}: {
  table: MeasurementTable;
}) => {
  const dispatch = useDispatch();
  const selectedSplits = useSelector(selectSelectedTableSplits)(table.id);
  const measurementData = useSelector(selectMeasurementData);
  const thingDict = useSelector(selectThingsDictionary);
  const splitWorker: Worker = useMemo(
    () => new Worker(new URL("./splitWorker.ts", import.meta.url)),
    []
  );
  const handleSelect = (event: React.SyntheticEvent, itemIds: string[]) => {
    const itemId = itemIds[0];
    const updates: RecursivePartial<SelectionTreeItems> = {};
    const updatedSelectionStatus = selectedSplits.includes(itemId)
      ? "off"
      : "on";
    selectTreeItemChildren(
      updates,
      itemId,
      table.splitStatus,
      updatedSelectionStatus
    );

    const { splitThings, activeMeasurements } = prepareMeasure(
      table.kind,
      thingDict,
      updates,
      table.measurementsStatus
    );

    if (window.Worker) {
      splitWorker.postMessage({
        currentMeasurements: measurementData,
        activeMeasurements,
        thingIds: splitThings,
      });
    }
    dispatch(
      measurementsSlice.actions.updateTableSplitState({
        tableId: table.id,
        updates,
      })
    );
  };

  useEffect(() => {
    if (window.Worker) {
      splitWorker.onmessage = (
        e: MessageEvent<Record<string, Record<string, number>>>
      ) => {
        if (!isObjectEmpty(e.data)) {
          dispatch(
            measurementsSlice.actions.updateMeasurements({
              measurementsDict: e.data,
            })
          );
        }
      };
    }
  }, [splitWorker, dispatch]);

  return (
    <SelectionTree
      treeItems={table.splitStatus}
      selectedItems={selectedSplits}
      handleSelect={handleSelect}
    />
  );
};

const prepareMeasure = (
  kind: string,
  things: Record<string, AnnotationObject | ImageObject>,
  updatedSplitStatus: RecursivePartial<SelectionTreeItems>,
  measurementsStatus: SelectionTreeItems
) => {
  const activeSplits = Object.entries(updatedSplitStatus).reduce(
    (active: string[], split) => {
      if (split[1]!.state === "on") {
        active.push(split[0]);
      }
      return active;
    },
    []
  );

  const splitThings = Object.values(things).reduce((split: string[], thing) => {
    if (thing.kind === kind) {
      const identifiers = [
        thing.categoryId.toLowerCase(),
        thing.partition.toLowerCase(),
      ];
      const matchedIdentifiers = intersection(identifiers, activeSplits);
      if (matchedIdentifiers.length > 0) {
        split.push(thing.id);
      }
    }
    return split;
  }, []);

  const activeMeasurements: string[] = [];
  Object.values(measurementsStatus).forEach((measurements) => {
    if (measurements.state === "on") {
      activeMeasurements.push(measurements.id.toLowerCase());
    }
  });

  return { splitThings, activeMeasurements };
};
