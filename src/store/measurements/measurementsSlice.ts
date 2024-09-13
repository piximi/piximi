import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RecursivePartial } from "utils/common/types";
import {
  MeasurementsState,
  MeasurementGroup,
  MeasurementOptions,
  ThingData,
  ThingMeasurements,
} from "./types";
import { generateUUID } from "utils/common/helpers";
import { isArray, merge, mergeWith } from "lodash";
import { baseMeasurementOptions } from "./constants";
import { Category } from "store/data/types";
import { Partition } from "utils/models/enums";

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
    createGroup(
      state,
      action: PayloadAction<{
        kind: string;
        categories: Category[];
        thingIds: string[];
        numChannels?: number;
      }>
    ) {
      const { kind, categories, thingIds, numChannels } = action.payload;
      const groupId = generateUUID();

      const usedNames = Object.values(state.groups).map((table) => table.name);
      let replicateNumber = 2;
      let candidateName = `${kind} Measurements`;

      while (usedNames.includes(candidateName)) {
        candidateName = `${kind} Measurements - Table ${replicateNumber}`;
        replicateNumber++;
      }

      const groupSplitStatus: MeasurementOptions = {
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
        groupSplitStatus[c.id] = {
          id: c.id,
          name: c.name,
          state: "off",
          parent: "categoryId",
        };
      });
      Object.keys(Partition).forEach((p) => {
        groupSplitStatus[p.toLowerCase()] = {
          id: p.toLowerCase(),
          name: p,
          state: "off",
          parent: "partition",
        };
      });

      const groupMeasurementStatus: MeasurementOptions = {};
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
              groupMeasurementStatus[id] = {
                id,
                name: `Channel ${i}`,
                state: "off",
                parent: measurement,
              };
              option.children.push(id);
              i++;
            }
          }
          groupMeasurementStatus[measurement] = option;
        }
      }

      state.groups[groupId] = {
        id: groupId,
        name: candidateName,
        kind: kind,
        measurementsStatus: groupMeasurementStatus,
        splitStatus: groupSplitStatus,
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
      }>
    ) {
      const { groupId, updates } = action.payload;
      state.groups[groupId].measurementsStatus = merge(
        state.groups[groupId].measurementsStatus,
        updates
      );
    },
    updateGroupName(
      state,
      action: PayloadAction<{ groupId: string; newName: string }>
    ) {
      state.groups[action.payload.groupId].name = action.payload.newName;
    },
    updateGroupSplitState(
      state,
      action: PayloadAction<{
        groupId: string;
        updates: RecursivePartial<MeasurementOptions>;
      }>
    ) {
      const { groupId, updates } = action.payload;
      state.groups[groupId].splitStatus = merge(
        state.groups[groupId].splitStatus,
        updates
      );
    },
    updateGroupSplitValues(
      state,
      action: PayloadAction<{
        groupId: string;
        remove?: string[];

        updates?: RecursivePartial<MeasurementOptions>;
      }>
    ) {
      const { groupId, remove, updates } = action.payload;
      if (updates) {
        state.groups[groupId].splitStatus = mergeWith(
          state.groups[groupId].splitStatus,
          updates,
          (
            objValue: MeasurementOptions,
            srcValue: RecursivePartial<MeasurementOptions>
          ) => {
            if (isArray(objValue)) {
              return srcValue;
            }
          }
        );
      }

      if (remove) {
        remove.forEach((id) => {
          delete state.groups[groupId].splitStatus[id];
        });
      }
    },

    updateGroupThingIds(
      state,
      action: PayloadAction<{
        groupId: string;
        thingIds: string[];
      }>
    ) {
      const { groupId, thingIds } = action.payload;
      state.groups[groupId].thingIds = thingIds;
    },

    updateMeasurements(
      state,
      action: PayloadAction<{
        dataDict?: ThingData;
        measurementsDict?: ThingMeasurements;
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
    removeThingMeasurements(
      state,
      action: PayloadAction<{ thingIds: string[] }>
    ) {
      action.payload.thingIds.forEach((id) => {
        delete state.data[id];
      });
    },
    setUpToDate(
      state,
      action: PayloadAction<{ groupId: string; upToDate: boolean }>
    ) {
      state.groups[action.payload.groupId].upToDate = action.payload.upToDate;
    },
  },
});
