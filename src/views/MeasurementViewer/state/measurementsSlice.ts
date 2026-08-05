import { createSlice } from "@reduxjs/toolkit";

import { generateInitialPlot } from "@MeasurementViewer/utils";
import { generateUUID } from "store/dataV2/utils";
import type { ChannelFeature, FeatureKey } from "store/dataV2/types";

import { mutatingFilter } from "utils/arrayUtils";
import { getUniqueName } from "utils/stringUtils";

import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  MeasurementsState,
  ObjectMeasurementGroup,
  ImageMeasurementGroup,
  ChartConfig,
  BaseMeasurementGroup,
  PivotItem,
} from "../types";
import { dataSliceV2 } from "store/dataV2";

const initialState: MeasurementsState = {
  activeGroup: undefined,
  imageGroups: {},
  objectGroups: {},
};

export const measurementsSlice = createSlice({
  initialState: initialState,
  name: "measurements",
  reducers: {
    resetMeasurements: () => initialState,
    setActiveGroup: (state, action: PayloadAction<string | undefined>) => {
      state.activeGroup = action.payload;
    },

    createGroup(
      state,
      action: PayloadAction<{
        groupType: "images" | "objects";
        kindId?: string;
        displayName?: string;
        itemIds: string[];
      }>,
    ) {
      const { kindId, itemIds, groupType } = action.payload;
      const displayName = action.payload.displayName ?? kindId ?? "Images";
      const groupId = generateUUID();

      const uniqueName = getUniqueName(displayName, [
        ...Object.keys(state.imageGroups),
        ...Object.keys(state.objectGroups),
      ]);

      const initialPlot = generateInitialPlot();

      const newGroup = {
        id: groupId,
        name: uniqueName,
        intensityMeasurements: [],
        computedMeasurements: [],
        existingMeasurements: [],
        splits: {},
        plots: { [initialPlot.id]: initialPlot },
        selectedPlotId: initialPlot.id,
        entityIds: itemIds,
        upToDate: true,
      };

      if (groupType === "images") {
        state.imageGroups[groupId] = newGroup as ImageMeasurementGroup;
      } else {
        state.objectGroups[groupId] = {
          ...newGroup,
          kind: kindId,
        } as ObjectMeasurementGroup;
      }
      state.activeGroup = groupId;
    },
    removeGroup(state, action: PayloadAction<string>) {
      const groupId = action.payload;
      const groupIds = [
        ...Object.keys(state.imageGroups),
        ...Object.keys(state.objectGroups),
      ];
      if (groupIds.length === 1) {
        state.activeGroup = undefined;
      } else if (groupId === state.activeGroup) {
        const groupIndex = groupIds.findIndex((id) => id === groupId);
        let newActiveGroupId: string;
        if (groupIndex + 1 === groupIds.length)
          newActiveGroupId = groupIds[groupIndex - 1];
        else newActiveGroupId = groupIds[groupIndex + 1];
        state.activeGroup = newActiveGroupId;
      }
      delete state.imageGroups[action.payload];
      delete state.objectGroups[action.payload];
    },

    updateGroupName(
      state,
      action: PayloadAction<{ groupId: string; newName: string }>,
    ) {
      const { groupId, newName } = action.payload;
      const group = state.imageGroups[groupId] ?? state.objectGroups[groupId];
      if (!group) return;
      group.name = newName;
    },

    updateSplits(
      state,
      action: PayloadAction<
        {
          groupId: string;
        } & Partial<BaseMeasurementGroup["splits"]>
      >,
    ) {
      const { groupId, ...rest } = action.payload;
      const group = state.objectGroups[groupId] ?? state.imageGroups[groupId];
      Object.assign(group.splits, rest);
    },
    updateActivePivotItems(state, action: PayloadAction<PivotItem[]>) {
      const pivotItems = action.payload;
      if (!state.activeGroup) return;
      const group =
        state.objectGroups[state.activeGroup] ??
        state.imageGroups[state.activeGroup];
      group.pivotItems = pivotItems;
    },
    setObjectComputedMeasurements(
      state,
      action: PayloadAction<{
        groupId: string;
        measurements: FeatureKey[];
      }>,
    ) {
      const { groupId, measurements } = action.payload;
      const group = state.objectGroups[groupId];
      group.computedMeasurements = measurements;
    },
    addObjectComputedMeasurements(
      state,
      action: PayloadAction<{
        groupId: string;
        measurements: FeatureKey[];
      }>,
    ) {
      const { groupId, measurements } = action.payload;
      const group = state.objectGroups[groupId];
      // Set is added guard to prevent duplicates, shouldnt ever happen,
      // and should probably be checked and prevented before dispatch
      group.computedMeasurements = [
        ...new Set([...group.computedMeasurements, ...measurements]),
      ];
    },
    removeObjectComputedMeasurements(
      state,
      action: PayloadAction<{
        groupId: string;
        measurements: FeatureKey[];
      }>,
    ) {
      const { groupId, measurements } = action.payload;
      const group = state.objectGroups[groupId];
      mutatingFilter(
        group.computedMeasurements,
        (msrmnt) => !measurements.includes(msrmnt),
      );
    },
    setImageComputedMeasurements(
      state,
      action: PayloadAction<{
        groupId: string;
        measurements: ChannelFeature[];
      }>,
    ) {
      const { groupId, measurements } = action.payload;
      const group = state.imageGroups[groupId];
      group.computedMeasurements = measurements;
    },
    addImageComputedMeasurements(
      state,
      action: PayloadAction<{
        groupId: string;
        measurements: ChannelFeature[];
      }>,
    ) {
      const { groupId, measurements } = action.payload;
      const group = state.imageGroups[groupId];
      // Set is added guard to prevent duplicates, shouldnt ever happen,
      // and should probably be checked and prevented before dispatch
      group.computedMeasurements = [
        ...new Set([...group.computedMeasurements, ...measurements]),
      ];
    },
    removeImageComputedMeasurements(
      state,
      action: PayloadAction<{
        groupId: string;
        measurements: ChannelFeature[];
      }>,
    ) {
      const { groupId, measurements } = action.payload;
      const group = state.imageGroups[groupId];
      mutatingFilter(
        group.computedMeasurements,
        (msrmnt) => !measurements.includes(msrmnt),
      );
    },
    addIntensityMeasurements(
      state,
      action: PayloadAction<{
        groupId: string;
        measurements: string[];
      }>,
    ) {
      const { groupId, measurements } = action.payload;
      const group = state.objectGroups[groupId] ?? state.imageGroups[groupId];
      group.intensityMeasurements = [
        ...new Set([...group.intensityMeasurements, ...measurements]),
      ];
    },
    removeIntensityMeasurements(
      state,
      action: PayloadAction<{
        groupId: string;
        measurements: string[];
      }>,
    ) {
      const { groupId, measurements } = action.payload;
      const group = state.objectGroups[groupId] ?? state.imageGroups[groupId];
      mutatingFilter(
        group.intensityMeasurements,
        (msrmnt) => !measurements.includes(msrmnt),
      );
    },

    setActiveGroupPlotId(state, action: PayloadAction<string>) {
      const plotId = action.payload;
      const activeGroupId = state.activeGroup;
      if (!activeGroupId) return;
      const activeGroup =
        state.imageGroups[activeGroupId] ?? state.objectGroups[activeGroupId];
      if (activeGroup.plots[plotId]) activeGroup.selectedPlotId = plotId;
    },
    addActiveGroupPlot(state) {
      const activeGroupId = state.activeGroup;
      if (!activeGroupId) return;
      const activeGroup =
        state.imageGroups[activeGroupId] ?? state.objectGroups[activeGroupId];

      const numPlots = Object.keys(activeGroup.plots).length;
      const initialPlot = generateInitialPlot();
      initialPlot.name = `Plot ${numPlots + 1}`;

      activeGroup.plots[initialPlot.id] = initialPlot;
      activeGroup.selectedPlotId = initialPlot.id;
    },
    editPlotName(
      state,
      action: PayloadAction<{ plotId: string; newName: string }>,
    ) {
      const { plotId, newName } = action.payload;
      const activeGroupId = state.activeGroup;
      if (!activeGroupId) return;
      const activeGroup =
        state.imageGroups[activeGroupId] ?? state.objectGroups[activeGroupId];
      const plot = activeGroup.plots[plotId];
      if (!plot) return;
      plot.name = newName;
    },
    removePlot(state, action: PayloadAction<string>) {
      const plotId = action.payload;
      const activeGroupId = state.activeGroup;
      if (!activeGroupId) return;
      const activeGroup =
        state.imageGroups[activeGroupId] ?? state.objectGroups[activeGroupId];
      const plotIds = Object.keys(activeGroup.plots);
      delete activeGroup.plots[plotId];
      if (plotIds.length === 1) {
        const newPlot = generateInitialPlot();
        activeGroup.plots[newPlot.id] = newPlot;
        activeGroup.selectedPlotId = newPlot.id;
      } else {
        const plotIndex = plotIds.findIndex((id) => id === plotId);
        if (plotIndex === -1) return;
        if (plotIndex === 0) activeGroup.selectedPlotId = plotIds[1];
        else activeGroup.selectedPlotId = plotIds[plotIndex - 1];
      }
    },
    updateActiveSelectedPlot(
      state,
      action: PayloadAction<{
        plotId: string;
        newConfig: Partial<ChartConfig>;
      }>,
    ) {
      const { plotId, newConfig } = action.payload;
      const activeGroupId = state.activeGroup;
      if (!activeGroupId) return;
      const group =
        state.imageGroups[activeGroupId] ?? state.objectGroups[activeGroupId];

      if (!group.plots[plotId]) return;
      Object.assign(group.plots[plotId].chartConfig, newConfig);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(dataSliceV2.actions.clearState, () => initialState);
  },
});
