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
import { IconButton, SvgIcon, Tooltip, Typography } from "@mui/material";
import { FilterBAndW } from "@mui/icons-material";

import { useHotkeys, useTranslation } from "hooks";

import { ToolHotkeyTitle } from "components/ui";

import { annotatorSlice } from "@ImageViewer/state/annotator";
import { selectAnnotationMode } from "@ImageViewer/state/annotator/selectors";
import {
  CombineAnnotationsIcon,
  IntersectAnnotationsIcon,
  NewAnnotationIcon,
  SubtractAnnotationsIcon,
} from "icons";
import { AnnotationMode } from "@ImageViewer/utils/enums";
import { selectVisibleAnnotations } from "@ImageViewer/state/image-viewer-data/reselectors";
import {
  selectIsPickingTarget,
  selectOverlapCandidateIds,
  selectResolvedTargetId,
} from "@ImageViewer/state/operations/reselectors";

import { HotkeyContext } from "utils/enums";
import type { HTMLDataAttributes } from "utils/types";

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
  const resolvedTargetId = useSelector(selectResolvedTargetId);

  const borders = useMemo(() => {
    const borders: Array<{
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }> = [];
    if (!isPickingTarget) return borders;
    overlapIds.forEach((id) => {
      if (id === resolvedTargetId) return;
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
  }, [overlapIds, visibleAnnotations, isPickingTarget, resolvedTargetId]);

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

const PANEL_WIDTH = 350;
const PANEL_HEIGHT = 100;
const BOTTOM_MARGIN = 16;

const iconColor = (active: boolean, enabled: boolean) => {
  if (!enabled) return "var(--mui-palette-action-disabled)";
  return active
    ? "var(--mui-palette-primary-dark)"
    : "var(--mui-palette-action-active)";
};
type ActionButtonProps = HTMLDataAttributes & {
  children: React.ReactNode;
  name: string;
  onClick: () => void;
  disabled?: boolean;
};
const ActionButton = ({
  children,
  name,
  onClick,
  disabled = false,
  ...attributes
}: ActionButtonProps) => {
  const description = useMemo(
    () => <ToolHotkeyTitle toolName={name} />,
    [name],
  );

  return (
    <Tooltip title={description} placement="top">
      <span>
        <IconButton
          size="small"
          disabled={disabled}
          onClick={onClick}
          sx={{ borderRadius: 0 }}
          {...attributes}
        >
          <SvgIcon
            sx={{
              width: "40px",
            }}
          >
            {children}
          </SvgIcon>
        </IconButton>
      </span>
    </Tooltip>
  );
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
    canInvert,
    hasStroke,
    numOverlapping,
    canIntertract,
  } = useAnnotationConfirmation(annotationTool);

  const { onCameraChange, getViewportState } = useThreeViewport();
  const foRef = useRef<SVGForeignObjectElement>(null);

  const handleModeSelection = (mode: AnnotationMode) => {
    dispatch(
      annotatorSlice.actions.setAnnotationMode({
        annotationMode: annotationMode === mode ? AnnotationMode.New : mode,
      }),
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
        <div
          style={{
            position: "absolute",
            width: "100%",
            // left: (0.05 * PANEL_WIDTH) / 2 + "px",
            display: "flex",
            justifyContent: "center",
            backgroundColor: "var(--mui-palette-background-paper)",
            borderRadius:
              "var(--mui-shape-borderRadius) var(--mui-shape-borderRadius) 0 0",
            height: "20px",
            top:
              annotationMode !== AnnotationMode.New && isPickingTarget
                ? 0
                : "25px",
            transition: "top ease-in-out 0.25s",
            borderTop: `1px solid var(--mui-palette-primary-main)`,
            borderLeft: `1px solid var(--mui-palette-primary-main)`,
            borderRight: `1px solid var(--mui-palette-primary-main)`,
            overflow: "hidden",
            zIndex: 998,
          }}
        >
          <Typography variant="caption">
            {`${numOverlapping} overlapping annotations -- click to select target`}
          </Typography>
        </div>
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
        <ActionButton
          name={t("Confirm")}
          onClick={confirm}
          disabled={!hasUpdates}
        >
          <CheckIcon
            sx={{
              color: !hasUpdates
                ? "var(--mui-palette-action-disabled)"
                : "var(--mui-palette-success-main)",
            }}
          />
        </ActionButton>
        <ActionButton
          name={t("Add as New Annotation")}
          onClick={() => handleModeSelection(AnnotationMode.New)}
          disabled={!hasStroke}
        >
          <NewAnnotationIcon
            color={iconColor(annotationMode === AnnotationMode.New, hasStroke)}
          />
        </ActionButton>
        <ActionButton
          name={t("Combine Annotations")}
          onClick={() => handleModeSelection(AnnotationMode.Add)}
          disabled={!canCombine}
        >
          <CombineAnnotationsIcon
            color={iconColor(annotationMode === AnnotationMode.Add, canCombine)}
          />
        </ActionButton>

        <ActionButton
          name={t("Subtract Annotations")}
          onClick={() => handleModeSelection(AnnotationMode.Subtract)}
          disabled={!canIntertract}
        >
          <SubtractAnnotationsIcon
            color={iconColor(
              annotationMode === AnnotationMode.Subtract,
              canIntertract,
            )}
          />
        </ActionButton>
        <ActionButton
          name={t("Annotation Intersection")}
          onClick={() => handleModeSelection(AnnotationMode.Intersect)}
          disabled={!canIntertract}
        >
          <IntersectAnnotationsIcon
            color={iconColor(
              annotationMode === AnnotationMode.Intersect,
              canIntertract,
            )}
          />
        </ActionButton>
        <ActionButton
          name={t("Invert Annotation")}
          onClick={() => handleModeSelection(AnnotationMode.Invert)}
          disabled={!canInvert}
        >
          <FilterBAndW
            sx={{
              color: iconColor(
                annotationMode === AnnotationMode.Invert,
                canInvert,
              ),
            }}
          />
        </ActionButton>
        <ActionButton
          name={t("Cancel")}
          onClick={cancel}
          disabled={!hasUpdates}
        >
          <CloseIcon
            sx={{
              color: !hasUpdates
                ? "var(--mui-palette-action-disabled)"
                : "var(--mui-palette-error-main)",
            }}
          />
        </ActionButton>
      </div>
    </foreignObject>
  );
};
