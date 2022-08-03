import { useSelector } from "react-redux";

import { Annotation } from "./Annotation";

import { unselectedAnnotationObjectsSelector } from "store/selectors";

export const ConfirmedAnnotations = () => {
  const confirmedAnnotationObjects = useSelector(
    unselectedAnnotationObjectsSelector
  );

  return (
    <>
      {confirmedAnnotationObjects.map((annotationToDraw) => (
        <Annotation
          annotation={annotationToDraw.annotation}
          imageShape={annotationToDraw.imageShape}
          fillColor={annotationToDraw.fillColor}
          key={annotationToDraw.annotation.id}
        />
      ))}
    </>
  );
};
