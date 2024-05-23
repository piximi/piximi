import React, { useEffect, useMemo } from "react";
import {
  selectMeasurementData,
  selectSelectedTableMeasurements,
} from "store/measurements/selectors";
import { useDispatch, useSelector } from "react-redux";
import { SelectionTreeItems, MeasurementTable } from "store/measurements/types";
import { RecursivePartial } from "utils/common/types";
import { measurementsSlice } from "store/measurements/measurementsSlice";
import { SelectionTree } from "components/styled-components";
import { isObjectEmpty, selectTreeItemChildren } from "utils/common/helpers";
import { AnnotationObject, ImageObject } from "store/data/types";
import { intersection } from "lodash";
import { selectThingsDictionary } from "store/data/selectors";
//import { theThing } from "./roiManager";
export const TableMeasurementTree = ({
  table,
}: {
  table: MeasurementTable;
}) => {
  const dispatch = useDispatch();
  const selectedMeasurements = useSelector(selectSelectedTableMeasurements)(
    table.id
  );
  const thingDict = useSelector(selectThingsDictionary);
  const measurementData = useSelector(selectMeasurementData);
  const measurementWorker: Worker = useMemo(
    () => new Worker(new URL("./measurementWorker.ts", import.meta.url)),
    []
  );

  const handleSelect = (event: React.SyntheticEvent, itemIds: string[]) => {
    const itemId = itemIds[0];
    const updates: RecursivePartial<SelectionTreeItems> = {};
    const updatedSelectionStatus = selectedMeasurements.includes(itemId)
      ? "off"
      : "on";
    selectTreeItemChildren(
      updates,
      itemId,
      table.measurementsStatus,
      updatedSelectionStatus
    );
    const { splitThings, activeMeasurements } = prepareMeasure(
      table.kind,
      thingDict,
      table.splitStatus,
      updates
    );

    splitThings.slice(0, 2).forEach((thing) => {
      // const result = theThing(
      //   measurementData[thing].maskData!,
      //   measurementData[thing].maskShape!
      // );
      //@ts-ignore
    });

    if (window.Worker) {
      measurementWorker.postMessage({
        currentMeasurements: measurementData,
        activeMeasurements,
        thingIds: splitThings,
      });
    }
    dispatch(
      measurementsSlice.actions.updateTableMeasurementState({
        tableId: table.id,
        updates,
      })
    );
  };

  useEffect(() => {
    if (window.Worker) {
      measurementWorker.onmessage = (
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
  }, [measurementWorker, dispatch]);

  return (
    <SelectionTree
      treeItems={table.measurementsStatus}
      selectedItems={selectedMeasurements}
      handleSelect={handleSelect}
      entryPoint="intensity"
    />
  );
};

const prepareMeasure = (
  kind: string,
  things: Record<string, AnnotationObject | ImageObject>,
  splitStatus: SelectionTreeItems,
  updatedMeasurements: RecursivePartial<SelectionTreeItems>
) => {
  const includeSplits: string[] = [];
  Object.values(splitStatus).forEach((split) => {
    if (split.state === "on") {
      includeSplits.push(split.id.toLowerCase());
    }
  });

  const splitThings = Object.values(things).reduce((split: string[], thing) => {
    if (thing.kind === kind) {
      const identifiers = [
        thing.categoryId.toLowerCase(),
        thing.partition.toLowerCase(),
      ];
      const matchedIdentifiers = intersection(identifiers, includeSplits);
      if (matchedIdentifiers.length > 0) {
        split.push(thing.id);
      }
    }
    return split;
  }, []);

  const activeMeasurements = Object.entries(updatedMeasurements).reduce(
    (active: string[], measurement) => {
      if (measurement[1]!.state === "on") {
        active.push(measurement[0]);
      }
      return active;
    },
    []
  );

  return { splitThings, activeMeasurements };
};
