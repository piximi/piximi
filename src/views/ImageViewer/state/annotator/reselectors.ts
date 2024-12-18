import { createSelector } from "@reduxjs/toolkit";

import { selectSelectedAnnotationIds } from "./selectors";
import { selectThingsDictionary } from "store/data/selectors";

import { decodeAnnotation } from "views/ImageViewer/utils/rle";

import { AnnotationObject, DecodedAnnotationObject } from "store/data/types";

export const selectSelectedAnnotations = createSelector(
  selectSelectedAnnotationIds,
  selectThingsDictionary,
  (selectedAnnotationIds, thingsDict) => {
    return selectedAnnotationIds.reduce(
      (anns: DecodedAnnotationObject[], id) => {
        const ann = thingsDict[id] as AnnotationObject;
        if (ann) {
          const decodedAnn =
            ann.decodedMask === undefined
              ? decodeAnnotation(ann)
              : (ann as DecodedAnnotationObject);
          anns.push(decodedAnn);
        }
        return anns;
      },
      []
    );
  }
);
