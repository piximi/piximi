import { EntityState } from "@reduxjs/toolkit";
import {
  V12Project,
  V11AnnotationObject,
  V11ImageObject,
  V11Project,
} from "../types";
import { AnnotationObject, ImageMetadata, ImageObject } from "store/data/types";
import { generateUUID } from "store/data/utils";
import { IMAGE_KIND } from "store/data/constants";
import { ColorsRaw } from "utils/types";
import { arrayRange } from "utils/arrayUtils";

export const v11_12_projectConverter = (v11Project: V11Project): V12Project => {
  const { things } = v11Project.data;

  const currentMetadata: EntityState<ImageMetadata, string> = {
    ids: [],
    entities: {},
  };
  const currentImageData: EntityState<ImageObject, string> = {
    ids: [],
    entities: {},
  };
  const currentAnnotations: EntityState<AnnotationObject, string> = {
    ids: [],
    entities: {},
  };
  const relationships: V12Project["data"]["relationships"] = {
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
        thing as V11ImageObject;
      const metadataId = generateUUID();
      const metadata: ImageMetadata = {
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
        color: colors.color.arraySync() as [number, number, number][],
      };
      const imageData: ImageObject = {
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
        thing as V11AnnotationObject;
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
  const currentCategories: V12Project["data"]["categories"] = {
    ids: [],
    entities: {},
  };
  const currentKinds: V12Project["data"]["kinds"] = {
    ids: [],
    entities: {},
  };
  Object.values(v11Project.data.categories.entities).forEach((category) => {
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
  Object.values(v11Project.data.kinds.entities).forEach((kind) => {
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
  const channels = v11Project.project.imageChannels;
  if (channels) {
    const channelNames = arrayRange(channels).reduce(
      (channelDict: Record<number, { id: number; name: string }>, id) => {
        channelDict[id] = { id, name: `Channel-${id + 1}` };
        return channelDict;
      },
      {},
    );
    v11Project.project.projectChannels = channelNames;
  }

  return {
    project: v11Project.project,
    classifier: v11Project.classifier,
    segmenter: v11Project.segmenter,
    data: {
      kinds: currentKinds,
      categories: currentCategories,
      metadata: currentMetadata,
      images: currentImageData,
      annotations: currentAnnotations,
      relationships,
      linkGraph: {},
      tracklets: {},
    },
  };
};
