import { useDispatch, useSelector } from "react-redux";
import {
  applicationSlice,
  setOperation,
  setSelectedCategory,
} from "../../store";
import { ToolType } from "../../types/ToolType";
import {
  createdCategoriesSelector,
  toolTypeSelector,
} from "../../store/selectors";
import { useHotkeys } from "react-hotkeys-hook";
import { ActionCreators } from "redux-undo";
import { AnnotationModeType } from "../../types/AnnotationModeType";
import hotkeys from "hotkeys-js";

export const useKeyboardShortcuts = () => {
  const dispatch = useDispatch();

  const categories = useSelector(createdCategoriesSelector);
  const toolType = useSelector(toolTypeSelector);

  // /*
  // Undo operation (Ctrl+z)
  // */
  // useHotkeys("ctrl+z", () => {
  //   dispatch(ActionCreators.jump(-1)); //undo should be allowed only if user did an accidental delete or an accidental modification to the selected annotation
  // });
  //
  // /*
  // Undo operation (Cmd+z)
  // */
  // useHotkeys("cmd+z", () => {
  //   dispatch(ActionCreators.jump(-1)); //undo should be allowed only if user did an accidental delete or an accidental modification to the selected annotation
  // });

  // /*
  //  * Cycle lasso tools (Shift + L)
  //  */
  // useHotkeys(
  //   "shift+l",
  //   () => {
  //     switch (toolType) {
  //       case ToolType.LassoAnnotation:
  //         dispatch(setOperation({ operation: ToolType.MagneticAnnotation }));
  //
  //         break;
  //       case ToolType.MagneticAnnotation:
  //         dispatch(setOperation({ operation: ToolType.PolygonalAnnotation }));
  //
  //         break;
  //       case ToolType.PolygonalAnnotation:
  //         dispatch(setOperation({ operation: ToolType.LassoAnnotation }));
  //
  //         break;
  //       default:
  //         dispatch(setOperation({ operation: ToolType.LassoAnnotation }));
  //
  //         break;
  //     }
  //   },
  //   [toolType]
  // );

  // /*
  //  * Cycle marquee tools (Shift + M)
  //  */
  // useHotkeys(
  //   "shift+m",
  //   () => {
  //     switch (toolType) {
  //       case ToolType.EllipticalAnnotation:
  //         dispatch(setOperation({ operation: ToolType.RectangularAnnotation }));
  //
  //         break;
  //       case ToolType.RectangularAnnotation:
  //         dispatch(setOperation({ operation: ToolType.EllipticalAnnotation }));
  //
  //         break;
  //       default:
  //         dispatch(setOperation({ operation: ToolType.RectangularAnnotation }));
  //
  //         break;
  //     }
  //   },
  //   [toolType]
  // );

  // /*
  //  * Cycle learning-based tools (Shift + W)
  //  */
  // useHotkeys(
  //   "shift+w",
  //   () => {
  //     switch (toolType) {
  //       case ToolType.ColorAnnotation:
  //         dispatch(setOperation({ operation: ToolType.ObjectAnnotation }));
  //
  //         break;
  //       case ToolType.ObjectAnnotation:
  //         dispatch(setOperation({ operation: ToolType.QuickAnnotation }));
  //
  //         break;
  //       case ToolType.QuickAnnotation:
  //         dispatch(setOperation({ operation: ToolType.ColorAnnotation }));
  //
  //         break;
  //       default:
  //         dispatch(setOperation({ operation: ToolType.ColorAnnotation }));
  //
  //         break;
  //     }
  //   },
  //   [toolType]
  // );

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

    dispatch(setSelectedCategory({ selectedCategory: selectedCategory.id }));
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

  /*
   * Key shortcuts for special selection mode
   * */
  // useHotkeys(
  //   "*",
  //   () => {
  //     if (hotkeys.shift) {
  //       if (toolType === ToolType.Pointer) return; //pointer tool has its own shift handler for multiple selections
  //       dispatch(
  //         applicationSlice.actions.setSelectionMode({
  //           selectionMode: AnnotationModeType.Add,
  //         })
  //       );
  //     }
  //     if (hotkeys.alt) {
  //       dispatch(
  //         applicationSlice.actions.setSelectionMode({
  //           selectionMode: AnnotationModeType.Subtract,
  //         })
  //       );
  //     }
  //   },
  //   [toolType]
  // );
};
