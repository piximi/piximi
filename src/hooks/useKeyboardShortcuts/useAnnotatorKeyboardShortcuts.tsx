import { useDispatch, useSelector } from "react-redux";
import { useHotkeys } from "hooks";

import { imageViewerSlice } from "store/imageViewer";

import { annotatorSlice } from "store/annotator";

import {
  selectActiveAnnotations,
  selectImageViewerImages,
  selectSelectedActiveAnnotations,
} from "store/imageViewer/reselectors";
import {
  AnnotationMode,
  AnnotationState,
  ToolType,
} from "utils/annotator/enums";
import { AnnotationTool } from "utils/annotator/tools";
import { HotkeyContext } from "utils/common/enums";
import {
  OldDecodedAnnotationType,
  DecodedAnnotationObject,
} from "store/data/types";
import { selectActiveImageId } from "store/imageViewer/selectors";
import { selectSoundEnabled } from "store/applicationSettings/selectors";

type useAnnotatorHotkeysProps = {
  annotationTool: AnnotationTool;
  deleteAnnotations: (
    annotationIds: Array<string>,
    activeAnnotations: Array<DecodedAnnotationObject>
  ) => void;
  deselectAllAnnotations: () => void;
  deselectAnnotation: () => void;
  resetZoomSelection: () => void;
  workingAnnotationEntity: {
    saved: OldDecodedAnnotationType | undefined;
    changes: Partial<OldDecodedAnnotationType>;
  };
  selectedAnnotationsIds: string[];
  selectionMode: AnnotationMode;
  toolType: ToolType;
};

export const useAnnotatorKeyboardShortcuts = ({
  annotationTool,
  deleteAnnotations,
  deselectAllAnnotations,
  deselectAnnotation,
  resetZoomSelection,
  workingAnnotationEntity,
  selectedAnnotationsIds,
  selectionMode,
  toolType,
}: useAnnotatorHotkeysProps) => {
  const dispatch = useDispatch();

  const images = useSelector(selectImageViewerImages);
  const activeImageId = useSelector(selectActiveImageId);
  const selectedAnnotations = useSelector(selectSelectedActiveAnnotations);
  const activeAnnotations = useSelector(selectActiveAnnotations);

  const confirmAnnotations = () => {
    if (
      !workingAnnotationEntity.saved ||
      annotationTool.annotationState === AnnotationState.Annotating ||
      !activeImageId
    )
      return;

    deselectAnnotation();

    if (selectionMode !== AnnotationMode.New)
      dispatch(
        annotatorSlice.actions.setSelectionMode({
          selectionMode: AnnotationMode.New,
        })
      );

    if (!selectedAnnotationsIds.length) return;

    deselectAllAnnotations();
  };

  const soundEnabled = useSelector(selectSoundEnabled);
  /*
   * Select category (1-9)
   */
  // useHotkeys(
  //   "shift+1,shift+2,shit+3,shift+4,shift+5,shift+6,shift+7,shift+8,shift+9",
  //   (event: KeyboardEvent, handler) => {
  //     const index = parseInt(handler.key.slice(-1));

  //     const selectedCategory = annotationCategories[index];

  //     if (!selectedCategory) return;

  //     dispatch(
  //       setSelectedCategoryId({
  //         selectedCategoryId: selectedCategory.id,
  //       })
  //     );
  //   },
  //   HotkeyView.AnnotatorView
  // );
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
    HotkeyContext.AnnotatorView
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
    HotkeyContext.AnnotatorView
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
    HotkeyContext.AnnotatorView
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
    HotkeyContext.AnnotatorView
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
    HotkeyContext.AnnotatorView
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
    HotkeyContext.AnnotatorView
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
    HotkeyContext.AnnotatorView
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
    HotkeyContext.AnnotatorView
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
    HotkeyContext.AnnotatorView
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
    HotkeyContext.AnnotatorView
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
    HotkeyContext.AnnotatorView
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
    HotkeyContext.AnnotatorView
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
    HotkeyContext.AnnotatorView
  );
  useHotkeys(
    "enter",
    () => {
      confirmAnnotations();
    },
    HotkeyContext.AnnotatorView,
    [
      activeImageId,
      annotationTool,
      annotationTool.annotationState,
      selectedAnnotations,
      activeAnnotations,
      selectionMode,
      selectedAnnotationsIds,
      soundEnabled,
      toolType,
    ]
  );

  useHotkeys(
    "escape",
    () => {
      deselectAllAnnotations();

      deselectAnnotation();

      if (toolType !== ToolType.Zoom) return;
      resetZoomSelection();
    },
    HotkeyContext.AnnotatorView,
    [annotationTool, soundEnabled, toolType]
  );

  useHotkeys(
    "backspace, delete",
    () => {
      deleteAnnotations(selectedAnnotationsIds, activeAnnotations);
      deselectAllAnnotations();

      deselectAnnotation();
    },
    HotkeyContext.AnnotatorView,
    [selectedAnnotationsIds, soundEnabled]
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
        })
      );
    },
    HotkeyContext.AnnotatorView,
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
        })
      );
    },
    HotkeyContext.AnnotatorView,
    [images, activeImageId]
  );
};
