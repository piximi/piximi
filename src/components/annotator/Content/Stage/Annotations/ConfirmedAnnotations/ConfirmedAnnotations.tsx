import React, { useEffect, useState } from "react";
import { AnnotationType } from "../../../../../../types/AnnotationType";
import { useSelector } from "react-redux";
import { visibleCategoriesSelector } from "../../../../../../store/selectors/visibleCategoriesSelector";
import { Annotation } from "./Annotation";
import { imageInstancesSelector } from "../../../../../../store/selectors";
import { selectedAnnotationsSelector } from "../../../../../../store/selectors/selectedAnnotationsSelector";
import { unselectedAnnotationsSelector } from "../../../../../../store/selectors/unselectedAnnotationsSelector";
import { activeImagePlaneSelector } from "../../../../../../store/selectors/activeImagePlaneSelector";

export const ConfirmedAnnotations = () => {
  const annotations = useSelector(imageInstancesSelector);

  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const unselectedAnnotations = useSelector(unselectedAnnotationsSelector);

  const selectedAnnotations = useSelector(selectedAnnotationsSelector);

  const visibleCategories = useSelector(visibleCategoriesSelector);

  const [visibleAnnotations, setVisibleAnnotations] = useState<
    Array<AnnotationType>
  >([]);

  useEffect(() => {
    if (!annotations) return;

    setVisibleAnnotations(
      unselectedAnnotations.filter((annotation: AnnotationType) => {
        return (
          visibleCategories.includes(annotation.categoryId) &&
          annotation.plane === activeImagePlane
        );
      })
    );
  }, [
    annotations,
    selectedAnnotations,
    visibleCategories,
    unselectedAnnotations,
  ]);

  return (
    <>
      {visibleAnnotations.map((annotation: AnnotationType) => (
        <Annotation annotation={annotation} key={annotation.id} />
      ))}
    </>
  );
};
