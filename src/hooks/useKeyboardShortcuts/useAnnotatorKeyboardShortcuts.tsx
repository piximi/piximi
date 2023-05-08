import { useDispatch, useSelector } from "react-redux";
import { useHotkeys } from "hooks";

import { selectAllAnnotationCategories } from "store/data";
import {
  imageViewerSlice,
  setSelectedCategoryId,
  activeImageIdSelector,
} from "store/imageViewer";

import { annotatorSlice } from "store/annotator";

import {
  selectSelectedImages,
  selectSelectedAnnotations,
  selectActiveAnnotations,
} from "store/data";
import { selectSoundEnabled } from "store/application";

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
    annotationIds: Array<string>,
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
  const stagedAnnotations = useSelector(selectActiveAnnotations);

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
        annotatorSlice.actions.setSelectionMode({
          selectionMode: AnnotationModeType.New,
        })
      );

    if (!selectedAnnotationsIds.length) return;

    deselectAllAnnotations();
    deselectAllTransformers();
  };

  const soundEnabled = useSelector(selectSoundEnabled);
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
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.ColorAnnotation,
        })
      );
    },
    HotkeyView.Annotator
  );
  /*
   * Select pencil tool (D)
   */
  useHotkeys(
    "shift+d",
    () => {
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.PenAnnotation,
        })
      );
    },
    HotkeyView.Annotator
  );
  /*
   * Select elliptical tool (E)
   */
  useHotkeys(
    "shift+e",
    () => {
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.EllipticalAnnotation,
        })
      );
    },
    HotkeyView.Annotator
  );
  /*
   * Select hand tool (H)
   */
  useHotkeys(
    "shift+h",
    () => {
      dispatch(
        annotatorSlice.actions.setToolType({ operation: ToolType.Hand })
      );
    },
    HotkeyView.Annotator
  );
  /*
   * Select intensity adjustment tool (I)
   */
  useHotkeys(
    "shift+i",
    () => {
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.ColorAdjustment,
        })
      );
    },
    HotkeyView.Annotator
  );
  /*
   * Select lasso tool (L)
   */
  useHotkeys(
    "shift+l",
    () => {
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.LassoAnnotation,
        })
      );
    },
    HotkeyView.Annotator
  );
  /*
   * Select magnetic tool (M)
   */
  useHotkeys(
    "shift+m",
    () => {
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.MagneticAnnotation,
        })
      );
    },
    HotkeyView.Annotator
  );
  /*
   * Select polygonal tool (P)
   */
  useHotkeys(
    "shift+p",
    () => {
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.PolygonalAnnotation,
        })
      );
    },
    HotkeyView.Annotator
  );
  /*
   * Select quick tool (Q)
   */
  useHotkeys(
    "shift+q",
    () => {
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.QuickAnnotation,
        })
      );
    },
    HotkeyView.Annotator
  );
  /*
   * Select rectangular tool (R)
   */
  useHotkeys(
    "shift+r",
    () => {
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.RectangularAnnotation,
        })
      );
    },
    HotkeyView.Annotator
  );
  /*
   * Select arrange tool (S)
   */
  useHotkeys(
    "shift+s",
    () => {
      dispatch(
        annotatorSlice.actions.setToolType({ operation: ToolType.Pointer })
      );
    },
    HotkeyView.Annotator
  );

  /*
   * Select threshold tool (T)
   */
  useHotkeys(
    "shift+t",
    () => {
      dispatch(
        annotatorSlice.actions.setToolType({
          operation: ToolType.ThresholdAnnotation,
        })
      );
    },
    HotkeyView.Annotator
  );

  /*
   * Select zoom tool (Z)
   */
  useHotkeys(
    "shift+z",
    () => {
      dispatch(
        annotatorSlice.actions.setToolType({ operation: ToolType.Zoom })
      );
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
        imageViewerSlice.actions.setActiveImageId({
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
        imageViewerSlice.actions.setActiveImageId({
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
