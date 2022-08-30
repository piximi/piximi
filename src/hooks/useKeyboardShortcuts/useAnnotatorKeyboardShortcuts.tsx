import { useDispatch, useSelector } from "react-redux";
import { useHotkeys } from "hooks";

import { annotationCategoriesSelector } from "store/project";
import { setOperation, setSelectedCategoryId } from "store/image-viewer";

import { HotkeyView, ToolType } from "types";

export const useAnnotatorKeyboardShortcuts = () => {
  const dispatch = useDispatch();

  const annotationCategories = useSelector(annotationCategoriesSelector);
  /*
   * Select category (1-9)
   */

  useHotkeys(
    "shift+1,shift+2,shit+3,shift+4,shift+5,shift+6,shift+7,shift+8,shift+9",
    (event: KeyboardEvent, handler) => {
      const index = parseInt(handler.key) - 1;

      const selectedCategory = annotationCategories[index];

      if (!selectedCategory) return;

      dispatch(
        setSelectedCategoryId({ selectedCategoryId: selectedCategory.id })
      );
    },
    HotkeyView.Annotator
  );
  /*
   * Select color tool (C)
   */
  useHotkeys(
    "shift+c",
    () => {
      dispatch(setOperation({ operation: ToolType.ColorAnnotation }));
    },
    HotkeyView.Annotator
  );
  /*
   * Select pencil tool (D)
   */
  useHotkeys(
    "shift+d",
    () => {
      dispatch(setOperation({ operation: ToolType.PenAnnotation }));
    },
    HotkeyView.Annotator
  );
  /*
   * Select elliptical tool (E)
   */
  useHotkeys(
    "shift+e",
    () => {
      dispatch(setOperation({ operation: ToolType.EllipticalAnnotation }));
    },
    HotkeyView.Annotator
  );
  /*
   * Select hand tool (H)
   */
  useHotkeys(
    "shift+h",
    () => {
      dispatch(setOperation({ operation: ToolType.Hand }));
    },
    HotkeyView.Annotator
  );
  /*
   * Select intensity adjustment tool (I)
   */
  useHotkeys(
    "shift+i",
    () => {
      dispatch(setOperation({ operation: ToolType.ColorAdjustment }));
    },
    HotkeyView.Annotator
  );
  /*
   * Select lasso tool (L)
   */
  useHotkeys(
    "shift+l",
    () => {
      dispatch(setOperation({ operation: ToolType.LassoAnnotation }));
    },
    HotkeyView.Annotator
  );
  /*
   * Select magnetic tool (M)
   */
  useHotkeys(
    "shift+m",
    () => {
      dispatch(setOperation({ operation: ToolType.MagneticAnnotation }));
    },
    HotkeyView.Annotator
  );
  /*
   * Select polygonal tool (P)
   */
  useHotkeys(
    "shift+p",
    () => {
      dispatch(setOperation({ operation: ToolType.PolygonalAnnotation }));
    },
    HotkeyView.Annotator
  );
  /*
   * Select quick tool (Q)
   */
  useHotkeys(
    "shift+q",
    () => {
      dispatch(setOperation({ operation: ToolType.QuickAnnotation }));
    },
    HotkeyView.Annotator
  );
  /*
   * Select rectangular tool (R)
   */
  useHotkeys(
    "shift+r",
    () => {
      dispatch(setOperation({ operation: ToolType.RectangularAnnotation }));
    },
    HotkeyView.Annotator
  );
  /*
   * Select arrange tool (S)
   */
  useHotkeys(
    "shift+s",
    () => {
      dispatch(setOperation({ operation: ToolType.Pointer }));
    },
    HotkeyView.Annotator
  );

  /*
   * Select threshold tool (T)
   */
  useHotkeys(
    "shift+t",
    () => {
      dispatch(setOperation({ operation: ToolType.ThresholdAnnotation }));
    },
    HotkeyView.Annotator
  );

  /*
   * Select zoom tool (Z)
   */
  useHotkeys(
    "shift+z",
    () => {
      dispatch(setOperation({ operation: ToolType.Zoom }));
    },
    HotkeyView.Annotator
  );
};
