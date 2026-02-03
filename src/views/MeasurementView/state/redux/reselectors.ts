import { createSelector } from "@reduxjs/toolkit";

import {
  selectActiveMeasurementGroup,
  selectImageMeasurementGroups,
  selectObjectMeasurementGroups,
} from "./selectors";
import {
  Dimension,
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
  selectTrackletEntities,
} from "store/data/selectors";
import {
  AnnotationObject,
  Category,
  ImageObject,
  Tracklet,
} from "store/data/types";
import { TreeViewBaseItem } from "@mui/x-tree-view";
import { capitalize } from "utils/stringUtils";
import { Partition } from "utils/models/enums";

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

export const selectActiveInitialPivotDimensions = createSelector(
  selectActiveMeasuredEntitiesGroup,
  selectCategoryEntities,
  selectImageDataEntities,
  selectTrackletEntities,
  (activeGroup, categories, imageData, tracklets) => {
    const categorySplit: Dimension = {
      id: "category",
      label: "Category",
      values: [],
    };

    const partitionSplit: Dimension = {
      id: "partition",
      label: "Partition",
      values: [],
    };
    const imageSplit: Dimension = {
      id: "image",
      label: "Image",
      values: [],
    };
    const trackletSplit: Dimension = {
      id: "tracklet",
      label: "Tracklet",
      values: [],
    };
    const timepointSplit: Dimension = {
      id: "timpoint",
      label: "Timepoint",
      values: [],
    };

    if (!activeGroup) return [categorySplit, partitionSplit];

    const entities = activeGroup.entities;
    const imageSet = new Set<ImageObject>();
    const trackSet = new Set<Tracklet>();
    const timepointSet = new Set<number>();
    const partitionSet = new Set<Partition>();
    const categorySet = new Set<Category>();
    for (const entity of Object.values(entities)) {
      partitionSet.add(entity.partition);
      categorySet.add(categories[entity.categoryId]);
      if ("imageId" in entity) imageSet.add(imageData[entity.imageId]);
      if ("trackId" in entity)
        trackSet.add(tracklets[entity.trackId].name ?? entity.trackId);
      if ("timepoint" in entity) timepointSet.add(entity.timepoint);
    }

    const splitTree: Dimension[] = [];
    categorySplit.values = [...categorySet].map((category) => ({
      id: category.id,
      label: capitalize(category.name),
      parentId: "category",
    }));
    splitTree.push(categorySplit);

    partitionSplit.values = [...partitionSet].map((ptn) => ({
      id: ptn,
      label: capitalize(ptn),
      parentId: "partition",
    }));
    splitTree.push(partitionSplit);

    if (imageSet.size > 0) {
      imageSplit.values = [...imageSet].map((ptn) => ({
        id: ptn.id,
        label: capitalize(ptn.name),
        parentId: "image",
      }));
      splitTree.push(imageSplit);
    }
    if (trackSet.size > 0) {
      trackletSplit.values = [...trackSet].map((ptn) => ({
        id: ptn.id,
        label: capitalize(ptn.name ?? ptn.id),
        parentId: "tracklet",
      }));
      splitTree.push(trackletSplit);
    }
    if (timepointSet.size > 0) {
      timepointSplit.values = [...timepointSet].sort().map((ptn) => ({
        id: ptn + "",
        label: ptn + "",
        parentId: "timepoint",
      }));
      splitTree.push(timepointSplit);
    }
    return splitTree;
  },
);

export const selectTableSplitOptions = createSelector(
  selectActiveMeasuredEntitiesGroup,
  selectCategoryEntities,
  selectImageDataEntities,
  selectTrackletEntities,
  (activeGroup, categories, imageData, tracklets) => {
    const categorySplit: TreeViewBaseItem = {
      id: "category",
      label: "Category",
    };

    const partitionSplit: TreeViewBaseItem = {
      id: "partition",
      label: "Partition",
    };
    const imageSplit: TreeViewBaseItem = {
      id: "image",
      label: "Image",
    };
    const trackletSplit: TreeViewBaseItem = {
      id: "tracklet",
      label: "Tracklet",
    };
    const timepointSplit: TreeViewBaseItem = {
      id: "timpoint",
      label: "Timepoint",
    };

    if (!activeGroup) return [categorySplit, partitionSplit];

    const entities = activeGroup.entities;
    const imageSet = new Set<ImageObject>();
    const trackSet = new Set<Tracklet>();
    const timepointSet = new Set<number>();
    const partitionSet = new Set<Partition>();
    const categorySet = new Set<Category>();
    for (const entity of Object.values(entities)) {
      partitionSet.add(entity.partition);
      categorySet.add(categories[entity.categoryId]);
      if ("imageId" in entity) imageSet.add(imageData[entity.imageId]);
      if ("trackId" in entity)
        trackSet.add(tracklets[entity.trackId].name ?? entity.trackId);
      if ("timepoint" in entity) timepointSet.add(entity.timepoint);
    }

    const splitTree: TreeViewBaseItem[] = [];
    categorySplit.children = [...categorySet].map((category) => ({
      id: category.id,
      label: capitalize(category.name),
      displayName: category.name,
    }));
    splitTree.push(categorySplit);

    partitionSplit.children = [...partitionSet].map((ptn) => ({
      id: ptn,
      label: capitalize(ptn),
      displayName: capitalize(ptn),
    }));
    splitTree.push(partitionSplit);

    if (imageSet.size > 0) {
      imageSplit.children = [...imageSet].map((ptn) => ({
        id: ptn.id,
        label: capitalize(ptn.name),
        displayName: capitalize(ptn.name),
      }));
      splitTree.push(imageSplit);
    }
    if (trackSet.size > 0) {
      trackletSplit.children = [...trackSet].map((ptn) => ({
        id: ptn.id,
        label: capitalize(ptn.name ?? ptn.id),
        displayName: capitalize(ptn.name ?? ptn.id),
      }));
      splitTree.push(trackletSplit);
    }
    if (timepointSet.size > 0) {
      timepointSplit.children = [...timepointSet].sort().map((ptn) => ({
        id: ptn + "",
        label: ptn + "",
        displayName: ptn + "",
      }));
      splitTree.push(timepointSplit);
    }
    return splitTree;
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
