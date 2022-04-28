import { useSelector } from "react-redux";
import { SelectedAnnotation } from "../SelectedAnnotation/SelectedAnnotation";
import { selectedAnnotationObjectsSelector } from "store/selectors/selectedAnnotationObjectsSelector";

export const SelectedAnnotations = () => {
  const selectedAnnotationObjects = useSelector(
    selectedAnnotationObjectsSelector
  );

  return (
    <>
      {selectedAnnotationObjects.map((annotationObject) => {
        return (
          <SelectedAnnotation
            key={annotationObject.annotation.id}
            annotation={annotationObject.annotation}
            imageShape={annotationObject.imageShape}
            fillColor={annotationObject.fillColor}
          />
        );
      })}
    </>
  );
};
