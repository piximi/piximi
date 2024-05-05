import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RecursivePartial } from "utils/common/types";
import {
  MeasurementsData,
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
      action: PayloadAction<{ kind: string; categories: Category[] }>
    ) {
      const tableId = generateUUID();

      const usedNames = Object.values(state.tables).map((table) => table.name);
      let version = 2;
      let candidateName = `${action.payload.kind} Measurements`;

      while (usedNames.includes(candidateName)) {
        candidateName = `${action.payload.kind} Measurements - Table ${version}`;
        version++;
      }

      const tableSplitStatus: SelectionTreeItems = {
        categoryId: {
          id: "categoryId",
          name: "Category",
          state: "off",
          children: action.payload.categories.map((c) => c.id),
        },
        partition: {
          id: "partition",
          name: "Partition",
          state: "off",
          children: Object.keys(Partition).map((p) => p.toLowerCase()),
        },
      };
      action.payload.categories.forEach((c) => {
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

      state.tables[tableId] = {
        id: tableId,
        name: candidateName,
        kind: action.payload.kind,
        measurementsStatus: state.measurementsStatus,
        splitStatus: tableSplitStatus,
        measuredThings: [],
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
        measurements: MeasurementsData;
      }>
    ) {
      state.measurementData = merge(
        state.measurementData,
        action.payload.measurements
      );
    },
  },
});
