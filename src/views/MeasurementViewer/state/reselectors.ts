import { createSelector } from "@reduxjs/toolkit";

import { toChannelMeasurementLabel } from "@MeasurementViewer/utils";
import {
  selectExtendedAnnotationEntities,
  selectCategoryEntities,
  selectExtendedImageEntities,
} from "store/data/selectors";
import {
  CHANNEL_MEASUREMENTS,
  type AnnotationObject,
  type Category,
  type ImageObject,
} from "store/data/types";

import { formatString } from "utils/stringUtils";
import type { Partition } from "utils/dl/enums";

import { selectActiveMeasurementGroup } from "./selectors";

import type {
  Dimension,
  ImageEntityMeasurementGroup,
  ObjectEntityMeasurementGroup,
  ParsedMeasurementData,
} from "../types";

export const selectActiveMeasuredEntities = createSelector(
  selectActiveMeasurementGroup,
  selectExtendedImageEntities,
  selectExtendedAnnotationEntities,
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
        CHANNEL_MEASUREMENTS.forEach((msrmt) => {
          const val = channel[msrmt];
          if (val) {
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
      const computed = annotation.features;

      const { comX, comY, ...computesSansCOM } = computed;
      parsedMeasurementData[id] = {
        id,
        kind: annotation.kindId,
        category: categories[annotation.categoryId].name,
        partition: annotation.partition,
        timepoint: 0,
        preview: "",
        measurements: { ...computesSansCOM },
      };
    });

    return parsedMeasurementData;
  },
);
