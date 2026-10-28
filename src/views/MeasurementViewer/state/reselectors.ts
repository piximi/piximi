import { createSelector } from "@reduxjs/toolkit";

import {
  INTENSITY_MEASUREMENTS,
  type Category,
  type ExtendedAnnotationObject,
  type ExtendedImageObject,
  type ImageObject,
} from "core/entities";

import {
  selectExtendedAnnotationEntities,
  selectCategoryEntities,
  selectExtendedImageEntities,
} from "store/data/selectors";

import { toChannelMeasurementLabel } from "@MeasurementViewer/utils";

import { selectActiveMeasurementGroup } from "./selectors";

import type { Partition } from "core/dl/enums";

import type {
  Dimension,
  ImageEntityMeasurementGroup,
  ObjectEntityMeasurementGroup,
  ParsedMeasurementData,
} from "../types";

/**
 * Group membership is derived rather than stored: an object group holds every
 * annotation of its kind and an image group holds every image. Deriving it
 * keeps the tables in step with additions, deletions and kind changes, and
 * means a group can never reference an entity that no longer exists.
 */
export const selectActiveMeasuredEntitiesGroup = createSelector(
  selectActiveMeasurementGroup,
  selectExtendedImageEntities,
  selectExtendedAnnotationEntities,
  (
    activeGroup,
    images,
    annotations,
  ): ImageEntityMeasurementGroup | ObjectEntityMeasurementGroup | undefined => {
    if (!activeGroup) return;
    if ("kind" in activeGroup)
      return {
        ...activeGroup,
        entities: Object.values(annotations).filter(
          (annotation) => annotation.kindId === activeGroup.kind,
        ),
      };
    else
      return {
        ...activeGroup,
        entities: Object.values(images),
      };
  },
);

export const selectActiveMeasuredEntities = createSelector(
  selectActiveMeasuredEntitiesGroup,
  (activeGroup) => {
    const entityDict: Record<
      string,
      ExtendedAnnotationObject | ExtendedImageObject
    > = {};
    for (const entity of activeGroup?.entities ?? []) {
      entityDict[entity.id] = entity;
    }
    return entityDict;
  },
);

export const selectActiveInitialPivotDimensions = createSelector(
  selectActiveMeasuredEntitiesGroup,
  selectCategoryEntities,
  selectExtendedImageEntities,
  (activeGroup, categories, imageData) => {
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

    const timepointSplit: Dimension = {
      id: "timpoint",
      label: "Timepoint",
      values: [],
    };

    if (!activeGroup) return [categorySplit, partitionSplit];

    const entities = activeGroup.entities;
    const imageSet = new Set<ImageObject>();
    const timepointSet = new Set<number>();
    const partitionSet = new Set<Partition>();
    const categorySet = new Set<Category>();
    for (const entity of Object.values(entities)) {
      partitionSet.add(entity.partition);
      categorySet.add(categories[entity.categoryId]);
      if ("imageId" in entity) imageSet.add(imageData[entity.imageId]);
      if ("timepoint" in entity) timepointSet.add(entity.timepoint);
    }

    const splitTree: Dimension[] = [];
    categorySplit.values = [...categorySet].map((category) => ({
      id: category.id,
      label: category.name,
      parentId: "category",
    }));
    splitTree.push(categorySplit);

    partitionSplit.values = [...partitionSet].map((ptn) => ({
      id: ptn,
      label: ptn,
      parentId: "partition",
    }));
    splitTree.push(partitionSplit);

    if (imageSet.size > 0) {
      imageSplit.values = [...imageSet].map((ptn) => ({
        id: ptn.id,
        label: ptn.name,
        parentId: "image",
      }));
      splitTree.push(imageSplit);
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
  selectExtendedImageEntities,
  selectExtendedAnnotationEntities,
  selectCategoryEntities,
  (images, annotations, categories): ParsedMeasurementData => {
    const parsedMeasurementData: ParsedMeasurementData = {};

    Object.entries(images).forEach(([id, image]) => {
      const channelMeasurements: Record<string, number> = {};
      image.channelsRef.forEach((channel) => {
        INTENSITY_MEASUREMENTS.forEach((msrmt) => {
          const val = channel[msrmt];
          if (val !== undefined) {
            const name = toChannelMeasurementLabel(channel.name, msrmt);
            channelMeasurements[name] = val;
          }
        });
      });
      parsedMeasurementData[id] = {
        id,
        kind: "Image",
        category: categories[image.categoryId].name,
        partition: image.partition,
        timepoint: image.timepoint,
        preview: "",
        measurements: { ...channelMeasurements },
      };
    });
    Object.entries(annotations).forEach(([id, annotation]) => {
      if (!annotation.features) return;
      const features = annotation.features;
      const intensityMeasurements: Record<string, number> = {};
      annotation.channelsRef.forEach((channel) => {
        INTENSITY_MEASUREMENTS.forEach((msrmt) => {
          const val = annotation.intensityMeasurements?.[channel.id]?.[msrmt];
          if (val !== undefined) {
            intensityMeasurements[
              toChannelMeasurementLabel(channel.name, msrmt)
            ] = val;
          }
        });
      });

      parsedMeasurementData[id] = {
        id,
        kind: annotation.kindId,
        category: categories[annotation.categoryId].name,
        partition: annotation.partition,
        timepoint: 0,
        preview: "",
        measurements: { ...features, ...intensityMeasurements },
      };
    });

    return parsedMeasurementData;
  },
);
