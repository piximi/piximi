import { createSelector } from "@reduxjs/toolkit";

import {
  selectActiveMeasurementGroup,
  selectImageMeasurementGroups,
  selectObjectMeasurementGroups,
} from "./selectors";
import {
  GroupedMeasurementDisplayTable,
  ImageEntityMeasurementGroup,
  ObjectEntityMeasurementGroup,
  ParsedMeasurementData,
} from "../../types";

import { IMAGE_KIND } from "store/data/constants";
import {
  selectAnnotationEntities,
  selectCategoryEntities,
  selectImageDataEntities,
} from "store/data/selectors";
import { AnnotationObject, ImageObject } from "store/data/types";

export const selectActiveMeasuredEntities = createSelector(
  selectActiveMeasurementGroup,
  selectImageDataEntities,
  selectAnnotationEntities,
  (activeGroup, images, annotations) => {
    if (!activeGroup) return {};
    if ("kind" in activeGroup)
      return activeGroup.entityIds.reduce(
        (entityDict: Record<string, AnnotationObject>, id) => {
          entityDict[id] = annotations[id];
          return entityDict;
        },
        {},
      );
    else
      return activeGroup.entityIds.reduce(
        (entityDict: Record<string, ImageObject>, id) => {
          entityDict[id] = images[id];
          return entityDict;
        },
        {},
      );
  },
);

export const selectActiveMeasuredEntitiesGroup = createSelector(
  selectActiveMeasurementGroup,
  selectImageDataEntities,
  selectAnnotationEntities,
  (
    activeGroup,
    images,
    annotations,
  ): ImageEntityMeasurementGroup | ObjectEntityMeasurementGroup | undefined => {
    if (!activeGroup) return;
    if ("kind" in activeGroup)
      return {
        ...activeGroup,
        entities: activeGroup.entityIds.map((id) => annotations[id]),
      };
    else
      return {
        ...activeGroup,
        entities: activeGroup.entityIds.map((id) => images[id]),
      };
  },
);

/**
 * Transforms raw measurement data into a format suitable for plotting/visualization.
 *
 * Denormalizes measurement data by combining:
 * - Measurement values (from measurementData)
 * - Thing metadata (kind, partition, categoryId)
 * - Category names (resolved from category entities)
 *
 * Returns a dictionary keyed by thingId with enriched measurement information.
 */
export const selectPlotData = createSelector(
  selectImageDataEntities,
  selectAnnotationEntities,
  selectCategoryEntities,
  (images, annotations, categories): ParsedMeasurementData => {
    const parsedMeasurementData: ParsedMeasurementData = {};

    Object.entries(images).forEach(([id, image]) => {
      if (!image.measurements) return;
      const { channels, ...computedMeasurements } = image.measurements;
      const channelMeasurements: Record<string, number> = {};
      channels.forEach((channel) => {
        const { channelId, channelData, histogram, ...measurements } = channel;
        Object.entries(measurements).forEach(([key, value]) => {
          const name = key + channelId;
          channelMeasurements[name] = value;
        });
      });
      parsedMeasurementData[id] = {
        id,
        kind: IMAGE_KIND,
        category: categories[image.categoryId].name,
        partition: image.partition,
        measurements: { ...computedMeasurements, ...channelMeasurements },
      };
    });
    Object.entries(annotations).forEach(([id, annotation]) => {
      if (!annotation.measurements) return;
      const { channels, com, ...computedMeasurements } =
        annotation.measurements;
      const channelMeasurements: Record<string, number> = {};
      channels.forEach((channel) => {
        const { channelId, channelData, histogram, ...measurements } = channel;
        Object.entries(measurements).forEach(([key, value]) => {
          const name = key + channelId;
          channelMeasurements[name] = value;
        });
      });
      parsedMeasurementData[id] = {
        id,
        kind: annotation.kind,
        category: categories[annotation.categoryId].name,
        partition: annotation.partition,
        measurements: { ...computedMeasurements, ...channelMeasurements },
      };
    });

    return parsedMeasurementData;
  },
);

/**
 * Generates grouped measurement tables for display in the UI.
 *
 * For each measurement group:
 * - Aggregates measurement values across all things in the group
 * - Splits the data by categorical dimensions (partition, category, etc.)
 * - Calculates statistics (mean, std, median) for each split
 * - Builds a table structure with rows for each split showing statistics
 *
 * Returns an array of display tables, one per group, with calculated statistics
 * for each measurement broken down by active split states.
 */
export const selectGroupMeasurementDisplayData = createSelector(
  selectImageMeasurementGroups,
  selectObjectMeasurementGroups,

  (imageGroups, objectGroups) => {
    const rGroups: GroupedMeasurementDisplayTable[] = [];
    const groups = [
      ...Object.values(imageGroups),
      ...Object.values(objectGroups),
    ];
    groups.forEach((group) => {
      // Initialize a display table for this measurement group
      const groupedTable: GroupedMeasurementDisplayTable = {
        id: group.id,
        kind: "kind" in group ? group.kind : IMAGE_KIND,
        title: group.name,
        measurements: { channels: [] },
        entitiyIds: group.entityIds,
      };

      rGroups.push(groupedTable);
    });

    return rGroups;
  },
);
