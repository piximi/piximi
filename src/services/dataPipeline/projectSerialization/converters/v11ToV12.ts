import { EntityState } from "@reduxjs/toolkit";
import {
  V11PiximiState,
  V11RawAnnotationObject,
  V11RawImageObject,
} from "../readers/version-types/v11Types";
import {
  V12RawAnnotationObject,
  V12Category,
  V12ImageMetadata,
  V12RawImageObject,
  V12Kind,
  V12PiximiState,
} from "../readers/version-types/v12Types";
import { IMAGE_KIND } from "store/data/constants";
import { generateUUID } from "store/data/utils";
import { ColorsRaw } from "utils/types";
import { arrayRange } from "utils/arrayUtils";

/**
 * Convert v1.1 project data to v1.2 format.
 *
 * Key transformations:
 * - Splits each image "thing" into ImageMetadata + ImageData
 * - Adds timepoint and plane fields to annotations
 * - Builds relationship graph (kindToCategories, imageToAnnotations, etc.)
 * - Drops "containing" from categories and kinds
 * - Colors: already ColorsRaw in our raw types, so NO .arraySync() needed
 *   (this was a pain point in the old converter)
 *
 * Mirrors logic from src/utils/file-io/converters/v11_12_projectConverter.ts
 * but operates on raw buffer types.
 */

export function convertV11ToV12(v11: V11PiximiState): V12PiximiState {
  const { things } = v11.data;

  const currentMetadata: EntityState<V12ImageMetadata, string> = {
    ids: [],
    entities: {},
  };
  const currentImageData: EntityState<V12RawImageObject, string> = {
    ids: [],
    entities: {},
  };
  const currentAnnotations: EntityState<V12RawAnnotationObject, string> = {
    ids: [],
    entities: {},
  };
  const relationships: V12PiximiState["data"]["relationships"] = {
    kindToCategories: {},
    kindToAnnotations: {},
    categoryToImages: {},
    categoryToAnnotations: {},
    imageToAnnotations: {},
    metadataToTracklets: {},
  };
  Object.values(things.entities).forEach((thing) => {
    if (thing.kind === IMAGE_KIND) {
      const { id, name, kind, bitDepth, containing, shape, colors, ...rest } =
        thing as V11RawImageObject;
      const metadataId = generateUUID();
      const metadata: V12ImageMetadata = {
        id: metadataId,
        name,
        kind,
        bitDepth,
        shape,
        imageDataIds: [id],
        defaultImageId: id,
        timeSeries: false,
      };
      const rawColors: ColorsRaw = {
        range: colors.range,
        visible: colors.visible,
        color: colors.color,
      };
      const imageData: V12RawImageObject = {
        id,
        metadataId,
        name,
        colors: rawColors,
        ...rest,
      };
      currentMetadata.ids.push(metadataId);
      currentMetadata.entities[metadataId] = metadata;
      currentImageData.ids.push(id);
      currentImageData.entities[id] = imageData;
      relationships.imageToAnnotations[id] = containing;
    } else {
      const { id, name, kind, bitDepth, ...rest } =
        thing as V11RawAnnotationObject;
      currentAnnotations.ids.push(id);
      currentAnnotations.entities[id] = {
        id,
        name,
        kind,
        bitDepth,
        ...rest,
        plane: 0,
        timepoint: 0,
      };
    }
  });
  const currentCategories: EntityState<V12Category, string> = {
    ids: [],
    entities: {},
  };
  const currentKinds: EntityState<V12Kind, string> = {
    ids: [],
    entities: {},
  };
  Object.values(v11.data.categories.entities).forEach((category) => {
    currentCategories.ids.push(category.id);
    currentCategories.entities[category.id] = {
      id: category.id,
      color: category.color,
      visible: category.visible,
      kind: category.kind,
      name: category.name,
    };
    if (category.kind === IMAGE_KIND)
      relationships.categoryToImages[category.id] = category.containing;
    else {
      relationships.categoryToAnnotations[category.id] = category.containing;
    }
  });
  Object.values(v11.data.kinds.entities).forEach((kind) => {
    currentKinds.ids.push(kind.id);
    currentKinds.entities[kind.id] = {
      id: kind.id,
      displayName: kind.displayName,
      unknownCategoryId: kind.unknownCategoryId,
    };
    if (kind.id !== IMAGE_KIND)
      relationships.kindToAnnotations[kind.id] = kind.containing;

    relationships.kindToCategories[kind.id] = kind.categories;
  });
  currentMetadata.ids.forEach((id) => {
    relationships.metadataToTracklets[id] = [];
  });
  const channels = v11.project.imageChannels;
  if (channels) {
    const channelNames = arrayRange(channels).reduce(
      (channelDict: Record<number, { id: number; name: string }>, id) => {
        channelDict[id] = { id, name: `Channel-${id + 1}` };
        return channelDict;
      },
      {},
    );
    v11.project.projectChannels = channelNames;
  }

  return {
    project: v11.project,
    classifier: v11.classifier,
    segmenter: v11.segmenter,
    data: {
      kinds: Object.values(currentKinds.entities),
      categories: Object.values(currentCategories.entities),
      metadata: Object.values(currentMetadata.entities),
      images: Object.values(currentImageData.entities),
      annotations: Object.values(currentAnnotations.entities),
      relationships,
    },
  };
}
