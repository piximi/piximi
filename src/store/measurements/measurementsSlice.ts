import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { isArray, merge, mergeWith } from "lodash";

import { generateUUID } from "store/data/helpers";

import { baseMeasurementOptions } from "./constants";
import { Partition } from "utils/models/enums";

import { Category } from "store/data/types";
import { RecursivePartial } from "utils/common/types";
import {
  MeasurementsState,
  MeasurementGroup,
  MeasurementOptions,
  ThingData,
  ThingMeasurements,
} from "./types";

const initialState: MeasurementsState = {
  data: {},
  state: baseMeasurementOptions,
  groups: {},
};

export const measurementsSlice = createSlice({
  initialState: initialState,
  name: "measurements",
  reducers: {
    resetMeasurements: () => initialState,

    updateChannelOptions(
      state,
      action: PayloadAction<{ numChannels: number }>,
    ) {
      const measurementOptions: MeasurementOptions = {};
      const channelOptions: MeasurementOptions = {};
      const numChannels = action.payload.numChannels;
      for (const measurement in state.state) {
        const option = state.state[measurement];
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
      Object.assign(state.state, measurementOptions, channelOptions);
    },
    createGroup(
      state,
      action: PayloadAction<{
        kindId: string;
        displayName?: string;
        categories: Category[];
        thingIds: string[];
        numChannels?: number;
      }>,
    ) {
      const { kindId, categories, thingIds, numChannels } = action.payload;
      const displayName = action.payload.displayName ?? kindId;
      const groupId = generateUUID();

      const usedNames = Object.values(state.groups).map((table) => table.name);
      let replicateNumber = 2;
      let candidateName = `${displayName} Measurements`;

      while (usedNames.includes(candidateName)) {
        candidateName = `${displayName} Measurements - Table ${replicateNumber}`;
        replicateNumber++;
      }

      const groupSplitState: MeasurementOptions = {
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
        groupSplitState[c.id] = {
          id: c.id,
          name: c.name,
          state: "off",
          parent: "categoryId",
        };
      });
      Object.keys(Partition).forEach((p) => {
        groupSplitState[p.toLowerCase()] = {
          id: p.toLowerCase(),
          name: p,
          state: "off",
          parent: "partition",
        };
      });

      const groupMeasurementState: MeasurementOptions = {};
      for (const measurement in baseMeasurementOptions) {
        const option = { ...baseMeasurementOptions[measurement] };
        if (
          option.thingType === "all" ||
          option.thingType === kindId ||
          (option.thingType !== "Image" && kindId !== "Image")
        ) {
          if (option.hasChannels) {
            option.children = [];
            let i = 0;
            while (i < numChannels!) {
              const id = `${measurement}-channel-${i}`;
              groupMeasurementState[id] = {
                id,
                name: `Channel ${i}`,
                state: "off",
                parent: measurement,
              };
              option.children.push(id);
              i++;
            }
          }
          groupMeasurementState[measurement] = option;
        }
      }

      state.groups[groupId] = {
        id: groupId,
        name: candidateName,
        kind: kindId,
        measurementStates: groupMeasurementState,
        splitStates: groupSplitState,
        thingIds: thingIds,
        upToDate: true,
      } as MeasurementGroup;
    },
    removeGroup(state, action: PayloadAction<{ groupId: string }>) {
      delete state.groups[action.payload.groupId];
    },
    updateGroupMeasurementState(
      state,
      action: PayloadAction<{
        groupId: string;
        updates: RecursivePartial<MeasurementOptions>;
      }>,
    ) {
      const { groupId, updates } = action.payload;
      state.groups[groupId].measurementStates = merge(
        state.groups[groupId].measurementStates,
        updates,
      );
    },
    updateGroupName(
      state,
      action: PayloadAction<{ groupId: string; newName: string }>,
    ) {
      state.groups[action.payload.groupId].name = action.payload.newName;
    },
    updateGroupSplitState(
      state,
      action: PayloadAction<{
        groupId: string;
        updates: RecursivePartial<MeasurementOptions>;
      }>,
    ) {
      const { groupId, updates } = action.payload;
      state.groups[groupId].splitStates = merge(
        state.groups[groupId].splitStates,
        updates,
      );
    },
    updateGroupSplitValues(
      state,
      action: PayloadAction<{
        groupId: string;
        remove?: string[];

        updates?: RecursivePartial<MeasurementOptions>;
      }>,
    ) {
      const { groupId, remove, updates } = action.payload;
      if (updates) {
        state.groups[groupId].splitStates = mergeWith(
          state.groups[groupId].splitStates,
          updates,
          (
            objValue: MeasurementOptions,
            srcValue: RecursivePartial<MeasurementOptions>,
          ) => {
            if (isArray(objValue)) {
              return srcValue;
            }
          },
        );
      }

      if (remove) {
        remove.forEach((id) => {
          delete state.groups[groupId].splitStates[id];
        });
      }
    },

    updateGroupThingIds(
      state,
      action: PayloadAction<{
        groupId: string;
        thingIds: string[];
      }>,
    ) {
      const { groupId, thingIds } = action.payload;
      state.groups[groupId].thingIds = thingIds;
    },

    updateMeasurements(
      state,
      action: PayloadAction<{
        dataDict?: ThingData;
        measurementsDict?: ThingMeasurements;
      }>,
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
            measurementsDict[thingId],
          );
        }
      }
    },
    removeThingMeasurements(
      state,
      action: PayloadAction<{ thingIds: string[] }>,
    ) {
      action.payload.thingIds.forEach((id) => {
        delete state.data[id];
      });
    },
    setUpToDate(
      state,
      action: PayloadAction<{ groupId: string; upToDate: boolean }>,
    ) {
      state.groups[action.payload.groupId].upToDate = action.payload.upToDate;
    },
  },
});
