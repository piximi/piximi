import { useDispatch, useSelector } from "react-redux";
import { ToolType } from "../../types/ToolType";
import { useHotkeys } from "react-hotkeys-hook";
import { setOperation, setSelectedCategoryId } from "../../store/slices";
import { annotationCategorySelector } from "store/selectors/annotationCategorySelector";

export const useAnnotatorKeyboardShortcuts = () => {
  const dispatch = useDispatch();

  const categories = useSelector(annotationCategorySelector);

  /*
   * Select arrange tool (V)
   */
  useHotkeys("shift+s", () => {
    dispatch(setOperation({ operation: ToolType.Pointer }));
  });

  /*
   * Select category (1-9)
   */
  useHotkeys("1,2,3,4,5,6,7,8,9", (event: KeyboardEvent) => {
    const index = parseInt(event.key) - 1;

    const selectedCategory = categories[index];

    if (!selectedCategory) return;

    dispatch(
      setSelectedCategoryId({ selectedCategoryId: selectedCategory.id })
    );
  });

  /*
   * Select color tool (W)
   */
  useHotkeys("shift+c", () => {
    dispatch(setOperation({ operation: ToolType.ColorAnnotation }));
  });

  /*
   * Select quick tool (W)
   */
  useHotkeys("shift+q", () => {
    dispatch(setOperation({ operation: ToolType.QuickAnnotation }));
  });

  /*
   * Select hand tool (H)
   */
  useHotkeys("shift+h", () => {
    dispatch(setOperation({ operation: ToolType.Hand }));
  });

  /*
   * Select lasso tool (L)
   */
  useHotkeys("shift+l", () => {
    dispatch(setOperation({ operation: ToolType.LassoAnnotation }));
  });

  /*
   * Select polygonal tool (L)
   */
  useHotkeys("shift+p", () => {
    dispatch(setOperation({ operation: ToolType.PolygonalAnnotation }));
  });

  /*
   * Select magnetic tool (M)
   */
  useHotkeys("shift+m", () => {
    dispatch(setOperation({ operation: ToolType.MagneticAnnotation }));
  });

  /*
   * Select pencil tool (P)
   */
  useHotkeys("shift+d", () => {
    dispatch(setOperation({ operation: ToolType.PenAnnotation }));
  });

  /*
   * Select rectangular tool (R)
   */
  useHotkeys("shift+r", () => {
    dispatch(setOperation({ operation: ToolType.RectangularAnnotation }));
  });

  /*
   * Select elliptical tool (E)
   */
  useHotkeys("shift+e", () => {
    dispatch(setOperation({ operation: ToolType.EllipticalAnnotation }));
  });

  /*
   * Select zoom tool (Z)
   */
  useHotkeys("shift+z", () => {
    dispatch(setOperation({ operation: ToolType.Zoom }));
  });

  /*
   * Select intensity adjustment tool (Z)
   */
  useHotkeys("shift+i", () => {
    dispatch(setOperation({ operation: ToolType.ColorAdjustment }));
  });
};
