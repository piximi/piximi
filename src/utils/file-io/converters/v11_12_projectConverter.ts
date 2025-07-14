import { EntityState } from "@reduxjs/toolkit";
import {
  CurrentProject,
  V11AnnotationObject,
  V11ImageObject,
  V11Project,
} from "../types";
import { TSAnnotationObject, TSImageObject } from "store/data/types";

export const v11_12_projectConverter = (
  v11Project: V11Project,
): CurrentProject => {
  const { things } = v11Project.data;

  const currentImages: EntityState<TSImageObject, string> = {
    ids: [],
    entities: {},
  };
  const currentAnnotations: EntityState<TSAnnotationObject, string> = {
    ids: [],
    entities: {},
  };
  Object.values(things.entities).forEach((thing) => {
    if (thing.kind === "Image") {
      const {
        id,
        name,
        kind,
        bitDepth,
        containing,
        shape,
        partition,
        ...rest
      } = thing as V11ImageObject;
      currentImages.ids.push(id);
      currentImages.entities[id] = {
        id,
        name,
        kind,
        bitDepth,
        containing,
        shape,
        partition,
        timepoints: { 0: rest },
      };
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
        timepoint: "0",
      };
    }
  });
  return {
    project: v11Project.project,
    classifier: v11Project.classifier,
    segmenter: v11Project.segmenter,
    data: {
      kinds: v11Project.data.kinds,
      categories: v11Project.data.categories,
      things: things,
      images: currentImages,
      annotations: currentAnnotations,
    },
  };
};
