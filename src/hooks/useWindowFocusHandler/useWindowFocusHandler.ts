// User has switched back to the tab
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { imageViewerSlice, selectionModeSelector } from "store/annotator";

import { AnnotationModeType } from "types";

export const useWindowFocusHandler = () => {
  const dispatch = useDispatch();
  const annotationMode = useSelector(selectionModeSelector);

  const onBlur = () => {
    if (annotationMode !== AnnotationModeType.New) {
      dispatch(
        imageViewerSlice.actions.setSelectionMode({
          selectionMode: AnnotationModeType.New,
        })
      );
    }
  };

  useEffect(() => {
    // window.addEventListener('focus', onFocus);
    window.addEventListener("blur", onBlur);
    // Specify how to clean up after this effect:
    return () => {
      // window.removeEventListener('focus', onFocus);
      window.removeEventListener("blur", onBlur);
    };
  });
};
