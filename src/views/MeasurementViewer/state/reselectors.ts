import { createSelector } from "@reduxjs/toolkit";

import { toChannelMeasurementLabel } from "@MeasurementViewer/utils";
import { IMAGE_KIND } from "store/data/constants";
import {
  selectAnnotationEntities,
  selectCategoryEntities,
  selectImageDataEntities,
  selectTrackletEntities,
} from "store/data/selectors";
import type {
  AnnotationObject,
  Category,
  ImageObject,
  Tracklet,
} from "store/data/types";

import { formatString } from "utils/stringUtils";
import type { Partition } from "utils/models/enums";
import { typedObjectEntries } from "utils/objectUtils";

import { selectActiveMeasurementGroup } from "./selectors";

import type {
  Dimension,
  ImageEntityMeasurementGroup,
  ObjectEntityMeasurementGroup,
  ParsedMeasurementData,
} from "../types";

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
      if ("trackId" in entity) trackSet.add(tracklets[entity.trackId]);
      if ("timepoint" in entity) timepointSet.add(entity.timepoint);
    }

    const splitTree: Dimension[] = [];
    categorySplit.values = [...categorySet].map((category) => ({
      id: category.id,
      label: formatString(category.name, undefined, "every-word"),
      parentId: "category",
    }));
    splitTree.push(categorySplit);

    partitionSplit.values = [...partitionSet].map((ptn) => ({
      id: ptn,
      label: formatString(ptn, undefined, "every-word"),
      parentId: "partition",
    }));
    splitTree.push(partitionSplit);

    if (imageSet.size > 0) {
      imageSplit.values = [...imageSet].map((ptn) => ({
        id: ptn.id,
        label: formatString(ptn.name, undefined, "every-word"),
        parentId: "image",
      }));
      splitTree.push(imageSplit);
    }
    if (trackSet.size > 0) {
      trackletSplit.values = [...trackSet].map((ptn) => ({
        id: ptn.id,
        label: formatString(ptn.name ?? ptn.id, undefined, "every-word"),
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
  selectTrackletEntities,
  selectCategoryEntities,
  (images, annotations, tracklets, categories): ParsedMeasurementData => {
    const parsedMeasurementData: ParsedMeasurementData = {};

    Object.entries(images).forEach(([id, image]) => {
      if (!image.measurements) return;
      const { channel, computed } = image.measurements;
      const channelMeasurements: Record<string, number> = {};
      Object.entries(channel).forEach(([channelId, measurements]) => {
        typedObjectEntries(measurements).forEach((entry) => {
          const [key, value] = entry!;
          const name = toChannelMeasurementLabel(channelId, key);
          channelMeasurements[name] = value!;
        });
      });
      parsedMeasurementData[id] = {
        id,
        kind: IMAGE_KIND,
        category: categories[image.categoryId].name,
        partition: image.partition,
        timepoint: image.timepoint,
        trackId: "N/A",
        preview: image.previewSrc,
        measurements: { ...computed, ...channelMeasurements },
      };
    });
    Object.entries(annotations).forEach(([id, annotation]) => {
      if (!annotation.measurements) return;
      const { channel, computed } = annotation.measurements;
      const channelMeasurements: Record<string, number> = {};
      Object.entries(channel).forEach(([channelId, measurements]) => {
        typedObjectEntries(measurements).forEach((entry) => {
          const [key, value] = entry!;
          const name = toChannelMeasurementLabel(channelId, key);
          channelMeasurements[name] = value!;
        });
      });
      const { com, ...computesSansCOM } = computed;
      parsedMeasurementData[id] = {
        id,
        kind: annotation.kind,
        category: categories[annotation.categoryId].name,
        partition: annotation.partition,
        timepoint: annotation.timepoint,
        trackId: annotation.trackId
          ? (tracklets[annotation.trackId].name ?? annotation.trackId)
          : "N/A",
        preview: annotation.previewSrc,
        measurements: { ...computesSansCOM, ...channelMeasurements },
      };
    });

    return parsedMeasurementData;
  },
);
