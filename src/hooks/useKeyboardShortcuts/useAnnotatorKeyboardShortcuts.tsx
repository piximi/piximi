import * as _ from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { useHotkeys } from "hooks";
import useSound from "use-sound";

import { annotationCategoriesSelector } from "store/project";
import {
  imageViewerSlice,
  setOperation,
  setSelectedCategoryId,
  selectedAnnotationsSelector,
  unselectedAnnotationsSelector,
  annotatorImagesSelector,
  activeImageIdSelector,
  soundEnabledSelector,
} from "store/image-viewer";

import {
  AnnotationModeType,
  AnnotationStateType,
  AnnotationType,
  HotkeyView,
  ToolType,
} from "types";
import { AnnotationTool } from "annotator/image/Tool";
import createAnnotationSoundEffect from "annotator/sounds/pop-up-on.mp3";
import deleteAnnotationSoundEffect from "annotator/sounds/pop-up-off.mp3";

type useAnnotatorHotkeysProps = {
  annotations: AnnotationType[];
  annotationTool: AnnotationTool | undefined;
  deselectAllAnnotations: () => void;
  deselectAllTransformers: () => void;
  deselectAnnotation: () => void;
  onZoomDeselect: () => void;
  selectedAnnotation: AnnotationType | undefined;
  selectedAnnotationsIds: string[];
  selectionMode: AnnotationModeType;
  toolType: ToolType;
};

export const useAnnotatorKeyboardShortcuts = ({
  annotations,
  annotationTool,
  deselectAllAnnotations,
  deselectAllTransformers,
  deselectAnnotation,
  onZoomDeselect,
  selectedAnnotation,
  selectedAnnotationsIds,
  selectionMode,
  toolType,
}: useAnnotatorHotkeysProps) => {
  const dispatch = useDispatch();

  const annotationCategories = useSelector(annotationCategoriesSelector);
  const images = useSelector(annotatorImagesSelector);
  const activeImageId = useSelector(activeImageIdSelector);
  const selectedAnnotations = useSelector(selectedAnnotationsSelector);
  const unselectedAnnotations = useSelector(unselectedAnnotationsSelector);

  const confirmAnnotations = () => {
    if (
      !selectedAnnotation ||
      !annotationTool ||
      annotationTool.annotationState === AnnotationStateType.Annotating ||
      !activeImageId
    )
      return;

    if (
      toolType === ToolType.PolygonalAnnotation ||
      toolType === ToolType.LassoAnnotation
    ) {
      annotationTool.connect();
    }

    dispatch(
      imageViewerSlice.actions.setImageInstances({
        instances: [...unselectedAnnotations, ...selectedAnnotations],
        imageId: activeImageId,
      })
    );

    deselectAnnotation();

    if (selectionMode !== AnnotationModeType.New)
      dispatch(
        imageViewerSlice.actions.setSelectionMode({
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
          execSaga: false,
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
      unselectedAnnotations,
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
      dispatch(
        imageViewerSlice.actions.deleteImageInstances({
          ids: selectedAnnotationsIds,
        })
      );
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
        imageViewerSlice.actions.setActiveImage({
          imageId: newActiveImageId,
          execSaga: false,
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
        imageViewerSlice.actions.setActiveImage({
          imageId: newActiveImageId,
          execSaga: false,
        })
      );
    },
    HotkeyView.Annotator,
    [images, activeImageId]
  );
};
