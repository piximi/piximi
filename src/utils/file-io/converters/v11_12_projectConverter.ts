import { EntityState } from "@reduxjs/toolkit";
import { CurrentProject, V11Project } from "../types";
import {
  AnnotationDetails,
  AnnotationObject,
  ImageObject,
  ImageTimePoint,
} from "store/data/types";

export const v11_12_projectConverter = (
  v11Project: V11Project,
): CurrentProject => {
  const { things } = v11Project.data;
  const currentThings: EntityState<ImageObject | AnnotationObject, string> = {
    ids: [],
    entities: {},
  };
  Object.values(things.entities).forEach((thing) => {
    const { id, name, kind, bitDepth, ...rest } = thing;
    currentThings.ids.push(id);

    if (thing.kind === "Image") {
      currentThings.entities[id] = {
        id,
        name,
        kind,
        bitDepth,
        timePoints: { 0: rest as ImageTimePoint },
      };
    } else {
      currentThings.entities[id] = {
        id,
        name,
        kind,
        bitDepth,
        ...(rest as AnnotationDetails),
        timePoint: 0,
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
      things: currentThings,
    },
  };
};
