import { createSelector } from "@reduxjs/toolkit";
import { selectThingsDictionary } from "store/data/selectors/selectors";
import { NewAnnotationType, NewDecodedAnnotationType } from "store/data/types";
import { ImageViewerState } from "store/types";
import { decodeAnnotationNew } from "utils/annotator/rle";

export const selectSelectedAnnotationIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
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
