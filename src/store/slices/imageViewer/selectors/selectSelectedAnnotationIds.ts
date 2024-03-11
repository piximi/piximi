import { createSelector } from "@reduxjs/toolkit";
import { selectThingsDictionary } from "store/slices/newData/selectors/selectors";
import { ImageViewer } from "types";
import {
  NewAnnotationType,
  NewDecodedAnnotationType,
} from "types/AnnotationType";
import { decodeAnnotationNew } from "utils/annotator/rle/rle";

export const selectSelectedAnnotationIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string[] => {
  return imageViewer.selectedAnnotationIds;
};

export const selectSelectedAnnotationIdsCount = createSelector(
  selectSelectedAnnotationIds,
  (selectedIds) => {
    return selectedIds.length;
  }
);

export const selectSelectedAnnotations = createSelector(
  selectSelectedAnnotationIds,
  selectThingsDictionary,
  (selectedAnnotationIds, thingsDict) => {
    return selectedAnnotationIds.reduce(
      (anns: NewDecodedAnnotationType[], id) => {
        const ann = thingsDict[id] as NewAnnotationType;
        if (ann) {
          const decodedAnn =
            ann.decodedMask === undefined
              ? decodeAnnotationNew(ann)
              : (ann as NewDecodedAnnotationType);
          anns.push(decodedAnn);
        }
        return anns;
      },
      []
    );
  }
);
