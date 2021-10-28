// User has switched back to the tab
import { useEffect, useState } from "react";
import { applicationSlice } from "../../store/slices";
import { AnnotationModeType } from "../../types/AnnotationModeType";
import { useDispatch } from "react-redux";

export const useWindowFocusHandler = () => {
  const dispatch = useDispatch();

  const onBlur = () => {
    dispatch(
      applicationSlice.actions.setSelectionMode({
        selectionMode: AnnotationModeType.New,
      })
    );
  };

  useEffect(() => {
    // window.addEventListener('focus', onFocus);
    window.addEventListener("blur", onBlur);
    // Specify how to clean up after this effect:
    return () => {
      // window.removeEventListener('focus', onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);
};
