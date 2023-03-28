import { useDispatch, useSelector } from "react-redux";
import { useHotkeys } from "hooks";

import { selectAllAnnotationCategories } from "store/data";
import {
  AnnotatorSlice,
  setOperation,
  setSelectedCategoryId,
  activeImageIdSelector,
  soundEnabledSelector,
} from "store/annotator";

import {
  selectSelectedImages,
  selectSelectedAnnotations,
  selectStagedAnnotations,
} from "store/data";

import {
  AnnotationModeType,
  AnnotationStateType,
  DecodedAnnotationType,
  HotkeyView,
  ToolType,
} from "types";
import { AnnotationTool } from "annotator-tools";

type useAnnotatorHotkeysProps = {
  annotations: DecodedAnnotationType[];
  annotationTool: AnnotationTool | undefined;
  deleteAnnotations: (
    selectedAnnotationIds: Array<string>,
    stagedAnnotations: Array<DecodedAnnotationType>
  ) => void;
  deselectAllAnnotations: () => void;
  deselectAllTransformers: () => void;
  deselectAnnotation: () => void;
  onZoomDeselect: () => void;
  workingAnnotation: DecodedAnnotationType | undefined;
  selectedAnnotationsIds: string[];
  selectionMode: AnnotationModeType;
  toolType: ToolType;
};

export const useAnnotatorKeyboardShortcuts = ({
  annotations,
  annotationTool,
  deleteAnnotations,
  deselectAllAnnotations,
  deselectAllTransformers,
  deselectAnnotation,
  onZoomDeselect,
  workingAnnotation,
  selectedAnnotationsIds,
  selectionMode,
  toolType,
}: useAnnotatorHotkeysProps) => {
  const dispatch = useDispatch();

  const annotationCategories = useSelector(selectAllAnnotationCategories);
  const images = useSelector(selectSelectedImages);
  const activeImageId = useSelector(activeImageIdSelector);
  const selectedAnnotations = useSelector(selectSelectedAnnotations);
  const stagedAnnotations = useSelector(selectStagedAnnotations);

  const confirmAnnotations = () => {
    if (
      !workingAnnotation ||
      !annotationTool ||
      annotationTool.annotationState === AnnotationStateType.Annotating ||
      !activeImageId
    )
      return;

    deselectAnnotation();

    if (selectionMode !== AnnotationModeType.New)
      dispatch(
        AnnotatorSlice.actions.setSelectionMode({
          selectionMode: AnnotationModeType.New,
        })
      );

    if (!selectedAnnotationsIds.length) return;

    deselectAllAnnotations();
    deselectAllTransformers();
  };

  const soundEnabled = useSelector(soundEnabledSelector);
  /*
   * Select category (1-9)
   */
  useHotkeys(
    "shift+1,shift+2,shit+3,shift+4,shift+5,shift+6,shift+7,shift+8,shift+9",
    (event: KeyboardEvent, handler) => {
      const index = parseInt(handler.key.slice(-1));

      const selectedCategory = annotationCategories[index];

      if (!selectedCategory) return;

      dispatch(
        setSelectedCategoryId({
          selectedCategoryId: selectedCategory.id,
          execSaga: true,
        })
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
  useHotkeys(
    "enter",
    () => {
      confirmAnnotations();
    },
    HotkeyView.Annotator,
    [
      activeImageId,
      annotations,
      annotationTool,
      annotationTool?.annotationState,
      selectedAnnotations,
      stagedAnnotations,
      selectionMode,
      selectedAnnotationsIds,
      soundEnabled,
      toolType,
    ]
  );

  useHotkeys(
    "escape",
    () => {
      if (!annotationTool) return;

      deselectAllAnnotations();
      deselectAllTransformers();

      deselectAnnotation();

      if (toolType !== ToolType.Zoom) return;
      onZoomDeselect();
    },
    HotkeyView.Annotator,
    [annotations, annotationTool, soundEnabled, toolType]
  );

  useHotkeys(
    "backspace, delete",
    () => {
      deleteAnnotations(selectedAnnotationsIds, stagedAnnotations);
      deselectAllAnnotations();
      deselectAllTransformers();

      deselectAnnotation();
    },
    HotkeyView.Annotator,
    [selectedAnnotationsIds, annotations, soundEnabled]
  );

  useHotkeys(
    "up",
    () => {
      if (!activeImageId) {
        return;
      }

      const activeImageIdx = images.findIndex(
        (image) => image.id === activeImageId
      );
      if (activeImageIdx < 1) {
        return;
      }

      const newActiveImageId = images[activeImageIdx - 1].id;
      dispatch(
        AnnotatorSlice.actions.setActiveImageId({
          imageId: newActiveImageId,
          prevImageId: activeImageId,
          execSaga: true,
        })
      );
    },
    HotkeyView.Annotator,
    [images, activeImageId]
  );

  useHotkeys(
    "down",
    () => {
      if (!activeImageId) {
        return;
      }

      const activeImageIdx = images.findIndex(
        (image) => image.id === activeImageId
      );
      if (activeImageIdx === -1 || activeImageIdx === images.length - 1) {
        return;
      }

      const newActiveImageId = images[activeImageIdx + 1].id;
      dispatch(
        AnnotatorSlice.actions.setActiveImageId({
          imageId: newActiveImageId,
          prevImageId: activeImageId,
          execSaga: true,
        })
      );
    },
    HotkeyView.Annotator,
    [images, activeImageId]
  );
};
