import React, { useEffect, useState } from "react";
import { AnnotationType } from "../../../../../../types/AnnotationType";
import { useSelector } from "react-redux";
import { visibleCategoriesSelector } from "../../../../../../store/selectors/visibleCategoriesSelector";
import { Annotation } from "./Annotation";
import { imageInstancesSelector } from "../../../../../../store/selectors";
import { selectedAnnotationsSelector } from "../../../../../../store/selectors/selectedAnnotationsSelector";
import { unselectedAnnotationsSelector } from "../../../../../../store/selectors/unselectedAnnotationsSelector";

export const ConfirmedAnnotations = () => {
  const annotations = useSelector(imageInstancesSelector);

  const unselectedAnnotations = useSelector(unselectedAnnotationsSelector);

  const selectedAnnotations = useSelector(selectedAnnotationsSelector);

  const visibleCategories = useSelector(visibleCategoriesSelector);

  const [visibleAnnotations, setVisibleAnnotations] = useState<
    Array<AnnotationType>
  >([]);

  useEffect(() => {
    if (!annotations) return;

    setVisibleAnnotations(
      unselectedAnnotations.filter((annotation: AnnotationType) =>
        visibleCategories.includes(annotation.categoryId)
      )
    );
  }, [annotations, selectedAnnotations, visibleCategories]);

  return (
    <>
      {visibleAnnotations.map((annotation: AnnotationType) => (
        <Annotation annotation={annotation} key={annotation.id} />
      ))}
    </>
  );
};
