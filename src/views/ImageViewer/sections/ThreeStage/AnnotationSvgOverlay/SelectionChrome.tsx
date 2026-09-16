import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

import { useDispatch, useSelector } from "react-redux";

import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { SvgIcon, Typography } from "@mui/material";

import { useHotkeys, useTranslation } from "hooks";

import { ToolButton } from "components/inputs";

import { HotkeyContext } from "utils/enums";

import {
  CombineAnnotationsIcon,
  IntersectAnnotationsIcon,
  NewAnnotationIcon,
  SubtractAnnotationsIcon,
} from "icons";

import { annotatorSlice } from "@ImageViewer/state/annotator";
import { selectAnnotationMode } from "@ImageViewer/state/annotator/selectors";
import { AnnotationMode } from "@ImageViewer/utils/enums";
import { selectVisibleAnnotations } from "@ImageViewer/state/image-viewer-data/reselectors";
import {
  selectIsPickingTarget,
  selectOverlapCandidateIds,
  selectResolvedTargetIds,
} from "@ImageViewer/state/operations/reselectors";

import { useThreeViewport } from "../ThreeViewportContext";
import { useAnnotationConfirmation } from "./useAnnotationConfirmation";

import type { AnnotationTool } from "@ImageViewer/utils/tools";

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

const PREVIEW_COLOR = "#00e5ff";

export const OverlapBorders = () => {
  const visibleAnnotations = useSelector(selectVisibleAnnotations);
  const overlapIds = useSelector(selectOverlapCandidateIds);
  const isPickingTarget = useSelector(selectIsPickingTarget);
  const resolvedTargetIds = useSelector(selectResolvedTargetIds);

  const borders = useMemo(() => {
    const borders: Array<{
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }> = [];
    if (!isPickingTarget) return borders;
    const resolved = new Set(resolvedTargetIds);

    overlapIds.forEach((id) => {
      if (resolved.has(id)) return;
      const visA = visibleAnnotations.find((a) => a.id === id);
      if (!visA) return;
      const [x0, y0, x1, y1] = visA.boundingBox;
      const x = Math.min(x0, x1);
      const y = Math.min(y0, y1);
      const w = Math.abs(x1 - x0);
      const h = Math.abs(y1 - y0);
      borders.push({ id: visA.id, x, y, w, h });
    });
    return borders;
  }, [overlapIds, visibleAnnotations, isPickingTarget, resolvedTargetIds]);

  return (
    <g>
      {borders.map((b) => (
        <rect
          key={`overlap-border-${b.id}`}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          fill="none"
          stroke={PREVIEW_COLOR}
          strokeDasharray="4"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </g>
  );
};

const ICON_INNER_WIDTH = 40;
const ICON_OUTER_WIDTH = 50;
const PANEL_WIDTH = ICON_OUTER_WIDTH * 6;
const PANEL_HEIGHT = 100;
const BOTTOM_MARGIN = 16;

const iconColor = (active: boolean, enabled: boolean) => {
  if (!enabled) return "var(--mui-palette-action-disabled)";
  return active
    ? "var(--mui-palette-primary-dark)"
    : "var(--mui-palette-action-active)";
};

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
}: {
  annotationTool: AnnotationTool;
}) => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const annotationMode = useSelector(selectAnnotationMode);
  const isPickingTarget = useSelector(selectIsPickingTarget);
  const {
    confirm,
    cancel,
    hasUpdates,
    canConfirm,
    canCombine,
    hasStroke,
    numOverlapping,
    canIntertract,
    unknownKind,
  } = useAnnotationConfirmation(annotationTool);

  const { onCameraChange, getViewportState } = useThreeViewport();
  const foRef = useRef<SVGForeignObjectElement>(null);

  const handleModeSelection = (mode: AnnotationMode) => {
    dispatch(
      annotatorSlice.actions.setAnnotationMode(
        annotationMode === mode ? AnnotationMode.New : mode,
      ),
    );
  };

  const applyPos = useCallback(() => {
    const fo = foRef.current;
    const vp = getViewportState();
    if (!fo || !vp) return;
    const screenX = (vp.stageWidth - PANEL_WIDTH) / 2;
    const screenY = vp.stageHeight - PANEL_HEIGHT - BOTTOM_MARGIN;
    fo.setAttribute("x", String(screenX));
    fo.setAttribute("y", String(screenY));
  }, [getViewportState]);

  useLayoutEffect(() => {
    applyPos();
  });
  useEffect(() => onCameraChange(applyPos), [onCameraChange, applyPos]);

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
      if (!event.repeat) {
        cancel();
      }
    },
    HotkeyContext.AnnotatorView,
    [canConfirm, cancel],
  );

  return (
    <foreignObject
      ref={foRef}
      width={PANEL_WIDTH}
      height={PANEL_HEIGHT}
      style={{
        pointerEvents: "auto",
        overflow: "visible",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "20px",
          position: "relative",
          zIndex: 998,
        }}
      >
        <ChromeAlert
          display={annotationMode !== AnnotationMode.New && isPickingTarget}
          text={`${numOverlapping} overlapping annotations -- click to select targets`}
          level={998}
        />

        <ChromeAlert
          display={unknownKind}
          text="Select or create a known kind before confirming"
          level={999}
        />
      </div>
      <div
        style={{
          position: "relative",
          backgroundColor: "var(--mui-palette-background-paper)",
          border: `1px solid var(--mui-palette-primary-main)`,
          borderTop:
            annotationMode !== AnnotationMode.New && isPickingTarget
              ? "1px solid var(--mui-palette-background-paper)"
              : "1px solid var(--mui-palette-primary-main)",
          borderRadius:
            annotationMode !== AnnotationMode.New && isPickingTarget
              ? " 0 0 var(--mui-shape-borderRadius) var(--mui-shape-borderRadius)"
              : "var(--mui-shape-borderRadius)",
          display: "flex",
          transition: "all ease-in-out 0.25s",
          zIndex: 999,
        }}
      >
        <ToolButton
          name={t("Confirm")}
          onClick={confirm}
          disabled={!hasUpdates || unknownKind}
          icon={
            <SvgIcon
              sx={{
                width: `${ICON_INNER_WIDTH}px`,
              }}
            >
              <CheckIcon
                sx={{
                  color:
                    !hasUpdates || unknownKind
                      ? "var(--mui-palette-action-disabled)"
                      : "var(--mui-palette-success-main)",
                }}
              />
            </SvgIcon>
          }
        />
        <ToolButton
          name={t("Add as New Annotation")}
          onClick={() => handleModeSelection(AnnotationMode.New)}
          disabled={!hasStroke}
          icon={
            <SvgIcon
              sx={{
                width: `${ICON_INNER_WIDTH}px`,
              }}
            >
              <NewAnnotationIcon
                color={iconColor(
                  annotationMode === AnnotationMode.New,
                  hasStroke,
                )}
              />
            </SvgIcon>
          }
        />
        <ToolButton
          name={t("Combine Annotations")}
          onClick={() => handleModeSelection(AnnotationMode.Add)}
          disabled={!canCombine}
          icon={
            <SvgIcon
              sx={{
                width: `${ICON_INNER_WIDTH}px`,
              }}
            >
              <CombineAnnotationsIcon
                color={iconColor(
                  annotationMode === AnnotationMode.Add,
                  canCombine,
                )}
              />
            </SvgIcon>
          }
        />

        <ToolButton
          name={t("Subtract Annotations")}
          onClick={() => handleModeSelection(AnnotationMode.Subtract)}
          disabled={!canIntertract}
          icon={
            <SvgIcon
              sx={{
                width: `${ICON_INNER_WIDTH}px`,
              }}
            >
              <SubtractAnnotationsIcon
                color={iconColor(
                  annotationMode === AnnotationMode.Subtract,
                  canIntertract,
                )}
              />
            </SvgIcon>
          }
        />
        <ToolButton
          name={t("Annotation Intersection")}
          onClick={() => handleModeSelection(AnnotationMode.Intersect)}
          disabled={!canIntertract}
          icon={
            <SvgIcon
              sx={{
                width: `${ICON_INNER_WIDTH}px`,
              }}
            >
              <IntersectAnnotationsIcon
                color={iconColor(
                  annotationMode === AnnotationMode.Intersect,
                  canIntertract,
                )}
              />
            </SvgIcon>
          }
        />

        <ToolButton
          name={t("Cancel")}
          onClick={cancel}
          disabled={!hasUpdates}
          icon={
            <SvgIcon
              sx={{
                width: `${ICON_INNER_WIDTH}px`,
              }}
            >
              <CloseIcon
                sx={{
                  color: !hasUpdates
                    ? "var(--mui-palette-action-disabled)"
                    : "var(--mui-palette-error-main)",
                }}
              />
            </SvgIcon>
          }
        />
      </div>
    </foreignObject>
  );
};

const ChromeAlert = ({
  display,
  text,
  level,
}: {
  display: boolean;
  text: string;
  level: number;
}) => {
  return (
    <div
      style={{
        position: "absolute",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        backgroundColor: "var(--mui-palette-background-paper)",
        borderRadius:
          "var(--mui-shape-borderRadius) var(--mui-shape-borderRadius) 0 0",
        height: "20px",
        top: display ? 0 : "25px",
        transition: "top ease-in-out 0.25s",
        borderTop: `1px solid var(--mui-palette-primary-main)`,
        borderLeft: `1px solid var(--mui-palette-primary-main)`,
        borderRight: `1px solid var(--mui-palette-primary-main)`,
        overflow: "hidden",
        zIndex: level,
      }}
    >
      <Typography variant="caption">{text}</Typography>
    </div>
  );
};
