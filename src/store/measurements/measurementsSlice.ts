import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RecursivePartial } from "utils/common/types";
import {
  MeasurementsState,
  MeasurementGroup,
  MeasurementOptions,
} from "./types";
import { generateUUID } from "utils/common/helpers";
import { merge } from "lodash";
import { baseMeasurementOptions } from "./constants";
import { Category } from "store/data/types";
import { Partition } from "utils/models/enums";
import { DataArray } from "image-js";

const initialState: MeasurementsState = {
  data: {},
  status: baseMeasurementOptions,
  groups: {},
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
      const measurementOptions: MeasurementOptions = {};
      const channelOptions: MeasurementOptions = {};
      const numChannels = action.payload.numChannels;
      for (const measurement in state.status) {
        const option = state.status[measurement];
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
      Object.assign(state.status, measurementOptions, channelOptions);
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

      const usedNames = Object.values(state.groups).map((table) => table.name);
      let version = 2;
      let candidateName = `${kind} Measurements`;

      while (usedNames.includes(candidateName)) {
        candidateName = `${kind} Measurements - Table ${version}`;
        version++;
      }

      const tableSplitStatus: MeasurementOptions = {
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

      const tableMeasurementStatus: MeasurementOptions = {};
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

      state.groups[tableId] = {
        id: tableId,
        name: candidateName,
        kind: kind,
        measurementsStatus: tableMeasurementStatus,
        splitStatus: tableSplitStatus,
        thingIds: thingIds,
      } as MeasurementGroup;
    },
    removeTable(state, action: PayloadAction<{ tableId: string }>) {
      delete state.groups[action.payload.tableId];
    },
    updateTableMeasurementState(
      state,
      action: PayloadAction<{
        tableId: string;
        updates: RecursivePartial<MeasurementOptions>;
      }>
    ) {
      const { tableId, updates } = action.payload;
      state.groups[tableId].measurementsStatus = merge(
        state.groups[tableId].measurementsStatus,
        updates
      );
    },
    updateTableName(
      state,
      action: PayloadAction<{ tableId: string; newName: string }>
    ) {
      state.groups[action.payload.tableId].name = action.payload.newName;
    },
    updateTableSplitState(
      state,
      action: PayloadAction<{
        tableId: string;
        updates: RecursivePartial<MeasurementOptions>;
      }>
    ) {
      const { tableId, updates } = action.payload;
      state.groups[tableId].splitStatus = merge(
        state.groups[tableId].splitStatus,
        updates
      );
    },

    updateMeasurements(
      state,
      action: PayloadAction<{
        dataDict?: Record<
          string,
          {
            channels: number[][];
            maskData: DataArray | undefined;
            maskShape: { width: number; height: number } | undefined;
          }
        >;
        measurementsDict?: Record<string, Record<string, number>>;
      }>
    ) {
      const { dataDict, measurementsDict } = action.payload;
      if (dataDict) {
        for (const thingId in dataDict) {
          if (thingId in state.data) {
            state.data[thingId].channelData = dataDict[thingId].channels;
            state.data[thingId].maskData = dataDict[thingId].maskData;
            state.data[thingId].maskShape = dataDict[thingId].maskShape;
          } else {
            state.data[thingId] = {
              channelData: dataDict[thingId].channels,
              maskData: dataDict[thingId].maskData,
              maskShape: dataDict[thingId].maskShape,
              measurements: {},
            };
          }
        }
      }
      if (measurementsDict) {
        for (const thingId in measurementsDict) {
          state.data[thingId].measurements = merge(
            state.data[thingId].measurements,
            measurementsDict[thingId]
          );
        }
      }
    },
  },
});
