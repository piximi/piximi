import type { CSSProperties } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import { useSound } from "use-sound";

import { useHotkeys } from "hooks";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectWorkingAnnotationEntity } from "views/ImageViewer/state/annotator/selectors";
import { selectSoundEnabled } from "store/applicationSettings/selectors";
import { selectPendingOperation } from "@ImageViewer/state/operations/reselectors";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";
import { selectActiveViewerImage } from "@ImageViewer/state/image-viewer-data/reselectors";
import type { AnnotationObject, AnnotationVolume } from "store/dataV2/types";
import { generateUUID } from "store/dataV2/utils";
import { selectSelectedCategory } from "@ImageViewer/state/image-viewer-data/selectors";
import { encode } from "@ImageViewer/utils";
import { dataSliceV2 } from "store/dataV2";

import { HotkeyContext } from "utils/enums";
import { Partition } from "utils/dl/enums";
import { computeObjectFeatures } from "utils/measurements/computeObjectFeatures";

import createAnnotationSoundEffect from "data/sounds/pop-up-on.mp3";
import deleteAnnotationSoundEffect from "data/sounds/pop-up-off.mp3";

import { useThreeViewport } from "../ThreeViewportContext";

import type { AnnotationTool } from "views/ImageViewer/utils/tools";

type BoundingBox = [number, number, number, number];

/** White selection outline drawn inside the overlay `<g>` (image coordinates). */
export const SelectionBorder = ({
  boundingBox,
}: {
  boundingBox: BoundingBox;
}) => {
  const [x0, y0, x1, y1] = boundingBox;
  const x = Math.min(x0, x1);
  const y = Math.min(y0, y1);
  const w = Math.abs(x1 - x0);
  const h = Math.abs(y1 - y0);
  if (w <= 0 || h <= 0) return null;
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill="none"
      stroke="#fff"
      strokeWidth={1.5}
      vectorEffect="non-scaling-stroke"
    />
  );
};

const buttonStyle = (fg: string): CSSProperties => ({
  background: "var(--mui-palette-background-paper)",
  color: fg,
  border: "none",
  borderRadius: 4,
  padding: "4px 10px",
  fontSize: 12,
  //fontWeight: "bold",
  textTransform: "uppercase",
  cursor: "pointer",
  boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
});

/**
 * Confirm/Cancel buttons, rendered as an HTML `<foreignObject>` in screen space
 * (pointer-events enabled) and positioned next to a bounding box.
 *
 * Two things can be pending, and Confirm means something different for each:
 * with no operation staged it commits the drawn stroke as a brand-new
 * annotation; with one staged it rewrites the surviving operand's geometry in
 * place and deletes whatever was absorbed. The second case has no working
 * annotation at all when the operands came from clicks rather than a stroke.
 */
export const SelectionButtons = ({
  annotationTool,
  boundingBox,
}: {
  annotationTool: AnnotationTool;
  boundingBox: BoundingBox;
}) => {
  const dispatch = useDispatch();
  const { onCameraChange, getImageToScreenTransform } = useThreeViewport();
  const foRef = useRef<SVGForeignObjectElement>(null);

  const workingAnnotation = useSelector(selectWorkingAnnotationEntity);
  const activeImage = useSelector(selectActiveViewerImage);
  const selectedCategory = useSelector(selectSelectedCategory);
  const soundEnabled = useSelector(selectSoundEnabled);
  const pendingOperation = useSelector(selectPendingOperation);

  const [playCreate] = useSound(createAnnotationSoundEffect);
  const [playDelete] = useSound(deleteAnnotationSoundEffect);

  const staged = !!pendingOperation && !pendingOperation.empty;
  const confirmLabel = staged ? "Apply" : "Create";

  const applyPos = useCallback(() => {
    const fo = foRef.current;
    const t = getImageToScreenTransform();
    if (!fo || !t) return;
    const [x0, y0, x1, y1] = boundingBox;
    const screenX = Math.max(x0, x1) * t.scale + t.tx;
    const screenY = Math.min(y0, y1) * t.scale + t.ty;
    fo.setAttribute("x", String(screenX + 8));
    fo.setAttribute("y", String(Math.max(0, screenY)));
  }, [getImageToScreenTransform, boundingBox]);

  useLayoutEffect(() => {
    applyPos();
  });
  useEffect(() => onCameraChange(applyPos), [onCameraChange, applyPos]);

  const clearAnnotation = useCallback(() => {
    annotationTool.deselect();
    batch(() => {
      dispatch(
        annotatorSlice.actions.setWorkingAnnotation({ annotation: undefined }),
      );
      dispatch(annotatorSlice.actions.clearPendingOperation());
    });
  }, [annotationTool, dispatch]);

  /**
   * Rewrite each changed annotation's geometry in place and delete the operands
   * folded into it. Identity is deliberately untouched: keeping `volumeId`
   * preserves category, kind and prediction metadata, which live on the volume.
   * Features are recomputed because they are mask-derived and would otherwise
   * go stale and corrupt feature-range filtering.
   */
  const applyOperation = useCallback(() => {
    if (!pendingOperation || pendingOperation.empty) return;
    const entries = Object.entries(pendingOperation.updates);
    if (entries.length === 0) return;

    batch(() => {
      entries.forEach(([id, region]) => {
        const features = computeObjectFeatures([
          {
            id,
            boundingBox: region.bbox,
            decodedMask: region.mask,
            encodedMask: [],
            features: undefined,
          },
        ]);
        dispatch(
          dataSliceV2.actions.updateAnnotationMask({
            id,
            boundingBox: region.bbox,
            encodedMask: encode(region.mask),
            features: features[id],
          }),
        );
      });
      if (pendingOperation.absorbedIds.length) {
        dispatch(
          dataSliceV2.actions.batchDeleteAnnotation(
            pendingOperation.absorbedIds,
          ),
        );
        // The absorbed ids are gone from the store; drop them from the manual
        // selection sets so they do not linger there.
        dispatch(
          imageViewerDataSlice.actions.forgetAnnotationIds(
            pendingOperation.absorbedIds,
          ),
        );
      }
    });
    if (soundEnabled) playCreate();

    clearAnnotation();
  }, [pendingOperation, dispatch, clearAnnotation, soundEnabled, playCreate]);

  const confirmAnnotation = useCallback(() => {
    if (!activeImage || !workingAnnotation.saved || !selectedCategory) return;
    const wAnn = workingAnnotation.saved;
    const volume: AnnotationVolume = {
      id: generateUUID(),
      imageId: wAnn.imageId,
      kindId: selectedCategory.kindId,
      categoryId: selectedCategory.id,
    };
    const bboxW = wAnn.boundingBox[2] - wAnn.boundingBox[0];
    const bboxH = wAnn.boundingBox[3] - wAnn.boundingBox[1];
    const annotation: AnnotationObject = {
      id: generateUUID(),
      imageId: wAnn.imageId,
      planeId: wAnn.planeId,
      volumeId: volume.id,
      partition: Partition.Unassigned,
      shape: { planes: 1, width: bboxW, height: bboxH, channels: 1 },
      boundingBox: wAnn.boundingBox,
      encodedMask: encode(wAnn.decodedMask),
    };
    const features = computeObjectFeatures([
      { ...annotation, decodedMask: wAnn.decodedMask },
    ]);
    annotation.features = features[annotation.id];
    batch(() => {
      dispatch(dataSliceV2.actions.addAnnotationVolume(volume));
      dispatch(dataSliceV2.actions.addAnnotation(annotation));
    });
    if (soundEnabled) playCreate();

    clearAnnotation();
  }, [
    activeImage,
    workingAnnotation,
    selectedCategory,
    soundEnabled,
    dispatch,
    clearAnnotation,
    playCreate,
  ]);

  const confirm = staged ? applyOperation : confirmAnnotation;
  const canConfirm = staged || !!workingAnnotation.saved;

  const cancel = useCallback(() => {
    clearAnnotation();
    if (soundEnabled) playDelete();
  }, [clearAnnotation, soundEnabled, playDelete]);

  useHotkeys(
    "enter",
    (event) => {
      if (!event.repeat && canConfirm) {
        confirm();
      }
    },
    HotkeyContext.AnnotatorView,
    [canConfirm, confirm],
  );
  useHotkeys(
    "esc",
    (event) => {
      if (!event.repeat && canConfirm) {
        cancel();
      }
    },
    HotkeyContext.AnnotatorView,
    [canConfirm, cancel],
  );

  return (
    <foreignObject
      ref={foRef}
      width={110}
      height={80}
      style={{ pointerEvents: "auto", overflow: "visible" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <button
          onClick={confirm}
          style={buttonStyle("var(--mui-palette-success-main)")}
        >
          {confirmLabel}
        </button>
        <button
          onClick={cancel}
          style={buttonStyle("var(--mui-palette-error-main")}
        >
          Cancel
        </button>
      </div>
    </foreignObject>
  );
};
