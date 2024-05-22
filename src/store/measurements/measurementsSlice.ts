import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RecursivePartial } from "utils/common/types";
import {
  MeasurementsState,
  MeasurementTable,
  SelectionTreeItems,
} from "./types";
import { generateUUID } from "utils/common/helpers";
import { merge } from "lodash";
import { baseMeasurementOptions } from "./constants";
import { Category } from "store/data/types";
import { Partition } from "utils/models/enums";

const initialState: MeasurementsState = {
  measurementData: {},
  measurementsStatus: baseMeasurementOptions,
  tables: {},
};

export const measurementsSlice = createSlice({
  initialState: initialState,
  name: "measurements",
  reducers: {
    resetMeasurements: () => initialState,

    updateChannelOptions(
      state,
      action: PayloadAction<{ numChannels: number }>
    ) {
      const measurementOptions: SelectionTreeItems = {};
      const channelOptions: SelectionTreeItems = {};
      const numChannels = action.payload.numChannels;
      for (const measurement in state.measurementsStatus) {
        const option = state.measurementsStatus[measurement];
        if (!option.children) {
          option.children = [];
          let i = 0;
          while (i < numChannels) {
            const id = `${measurement}-channel-${i}`;
            channelOptions[id] = {
              id,
              name: `Channel ${i}`,
              state: "off",
              parent: measurement,
            };
            option.children.push(id);
            i++;
          }
          measurementOptions[measurement] = option;
        }
      }
      Object.assign(
        state.measurementsStatus,
        measurementOptions,
        channelOptions
      );
    },
    createTable(
      state,
      action: PayloadAction<{
        kind: string;
        categories: Category[];
        thingIds: string[];
        numChannels?: number;
      }>
    ) {
      const { kind, categories, thingIds, numChannels } = action.payload;
      const tableId = generateUUID();

      const usedNames = Object.values(state.tables).map((table) => table.name);
      let version = 2;
      let candidateName = `${kind} Measurements`;

      while (usedNames.includes(candidateName)) {
        candidateName = `${kind} Measurements - Table ${version}`;
        version++;
      }

      const tableSplitStatus: SelectionTreeItems = {
        categoryId: {
          id: "categoryId",
          name: "Category",
          state: "off",
          children: categories.map((c) => c.id),
        },
        partition: {
          id: "partition",
          name: "Partition",
          state: "off",
          children: Object.keys(Partition).map((p) => p.toLowerCase()),
        },
      };
      categories.forEach((c) => {
        tableSplitStatus[c.id] = {
          id: c.id,
          name: c.name,
          state: "off",
          parent: "categoryId",
        };
      });
      Object.keys(Partition).forEach((p) => {
        tableSplitStatus[p.toLowerCase()] = {
          id: p.toLowerCase(),
          name: p,
          state: "off",
          parent: "partition",
        };
      });

      const tableMeasurementStatus: SelectionTreeItems = {};
      for (const measurement in baseMeasurementOptions) {
        const option = { ...baseMeasurementOptions[measurement] };
        if (
          option.thingType === "all" ||
          option.thingType === kind ||
          (option.thingType !== "Image" && kind !== "Image")
        ) {
          if (option.hasChannels) {
            option.children = [];
            let i = 0;
            while (i < numChannels!) {
              const id = `${measurement}-channel-${i}`;
              tableMeasurementStatus[id] = {
                id,
                name: `Channel ${i}`,
                state: "off",
                parent: measurement,
              };
              option.children.push(id);
              i++;
            }
          }
          tableMeasurementStatus[measurement] = option;
        }
      }

      state.tables[tableId] = {
        id: tableId,
        name: candidateName,
        kind: kind,
        measurementsStatus: tableMeasurementStatus,
        splitStatus: tableSplitStatus,
        thingIds: thingIds,
      } as MeasurementTable;
    },
    removeTable(state, action: PayloadAction<{ tableId: string }>) {
      delete state.tables[action.payload.tableId];
    },
    updateTableMeasurementState(
      state,
      action: PayloadAction<{
        tableId: string;
        updates: RecursivePartial<SelectionTreeItems>;
      }>
    ) {
      const { tableId, updates } = action.payload;
      state.tables[tableId].measurementsStatus = merge(
        state.tables[tableId].measurementsStatus,
        updates
      );
    },
    updateTableName(
      state,
      action: PayloadAction<{ tableId: string; newName: string }>
    ) {
      state.tables[action.payload.tableId].name = action.payload.newName;
    },
    updateTableSplitState(
      state,
      action: PayloadAction<{
        tableId: string;
        updates: RecursivePartial<SelectionTreeItems>;
      }>
    ) {
      const { tableId, updates } = action.payload;
      state.tables[tableId].splitStatus = merge(
        state.tables[tableId].splitStatus,
        updates
      );
    },

    updateMeasurements(
      state,
      action: PayloadAction<{
        channelDataDict?: Record<string, number[][]>;
        measurementsDict?: Record<string, Record<string, number>>;
      }>
    ) {
      const { channelDataDict, measurementsDict } = action.payload;
      if (channelDataDict) {
        for (const thingId in channelDataDict) {
          if (thingId in state.measurementData) {
            state.measurementData[thingId].channelData =
              channelDataDict[thingId];
          } else {
            state.measurementData[thingId] = {
              channelData: channelDataDict[thingId],
              measurements: {},
            };
          }
        }
      }
      if (measurementsDict) {
        for (const thingId in measurementsDict) {
          state.measurementData[thingId].measurements = merge(
            state.measurementData[thingId].measurements,
            measurementsDict[thingId]
          );
        }
      }
    },
  },
});
