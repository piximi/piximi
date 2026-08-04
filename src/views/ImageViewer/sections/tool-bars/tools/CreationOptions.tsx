import { useDispatch, useSelector } from "react-redux";

import { FilterBAndW } from "@mui/icons-material";
import { Stack, SvgIcon, useTheme } from "@mui/material";

import { useTranslation } from "hooks";

import { Tool } from "components/ui";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  selectAnnotationMode,
  selectWorkingAnnotationEntity,
} from "views/ImageViewer/state/annotator/selectors";
import {
  selectOverlapCandidateIds,
  selectSelectionOperandIds,
} from "@ImageViewer/state/operations/reselectors";
import { AnnotationMode } from "views/ImageViewer/utils/enums";
import {
  CombineAnnotationsIcon,
  IntersectAnnotationsIcon,
  NewAnnotationIcon,
  SubtractAnnotationsIcon,
} from "icons";

/**
 * The operation to apply on the next confirm, chosen *after* drawing rather than
 * as a sticky mode beforehand — the point at which both operands exist.
 *
 * Two ways in. With a stroke on screen, the combining operations act on an
 * annotation it overlaps, so they need at least one overlap candidate. With no
 * stroke they act on click-selected annotations instead, which is why they need
 * two operands there: the first survives and the rest are folded into it. Only
 * clicks carry an order, so annotations selected by category or feature range
 * are not operands.
 */
export const CreationOptions = () => {
  const dispatch = useDispatch();
  const t = useTranslation();
  const theme = useTheme();

  const annotationMode = useSelector(selectAnnotationMode);
  const workingAnnotationEntity = useSelector(selectWorkingAnnotationEntity);
  const overlapCandidates = useSelector(selectOverlapCandidateIds);
  const selectionOperands = useSelector(selectSelectionOperandIds);

  const hasStroke = !!workingAnnotationEntity.saved;

  // Combining needs a second operand from somewhere: an overlapped annotation
  // when there is a stroke, or a second click-selected annotation when not.
  const canCombine = hasStroke
    ? overlapCandidates.length > 0
    : selectionOperands.length >= 2;
  // Invert transforms operands where they sit, so one is enough — and it has no
  // stroke form, since inverting a mask needs no second operand.
  const canInvert = !hasStroke && selectionOperands.length >= 1;

  const handleModeSelection = (mode: AnnotationMode) => {
    dispatch(
      annotatorSlice.actions.setAnnotationMode({
        annotationMode: annotationMode === mode ? AnnotationMode.New : mode,
      }),
    );
  };

  const iconColor = (mode: AnnotationMode, enabled: boolean) => {
    if (!enabled) return theme.palette.action.disabled;
    return mode === annotationMode
      ? theme.palette.primary.dark
      : theme.palette.action.active;
  };

  return (
    <Stack data-help={HelpItem.ObjectManipulationTools}>
      <Tool
        name={t("Add as New Annotation")}
        onClick={() => handleModeSelection(AnnotationMode.New)}
        disabled={!hasStroke}
        selected={annotationMode === AnnotationMode.New}
        tooltipLocation="left"
      >
        <NewAnnotationIcon color={iconColor(AnnotationMode.New, hasStroke)} />
      </Tool>
      <Tool
        name={t("Combine Annotations")}
        onClick={() => handleModeSelection(AnnotationMode.Add)}
        disabled={!canCombine}
        selected={annotationMode === AnnotationMode.Add}
        tooltipLocation="left"
      >
        <CombineAnnotationsIcon
          color={iconColor(AnnotationMode.Add, canCombine)}
        />
      </Tool>

      <Tool
        name={t("Subtract Annotations")}
        onClick={() => handleModeSelection(AnnotationMode.Subtract)}
        disabled={!canCombine}
        selected={annotationMode === AnnotationMode.Subtract}
        tooltipLocation="left"
      >
        <SubtractAnnotationsIcon
          color={iconColor(AnnotationMode.Subtract, canCombine)}
        />
      </Tool>
      <Tool
        name={t("Annotation Intersection")}
        onClick={() => handleModeSelection(AnnotationMode.Intersect)}
        disabled={!canCombine}
        selected={annotationMode === AnnotationMode.Intersect}
        tooltipLocation="left"
      >
        <IntersectAnnotationsIcon
          color={iconColor(AnnotationMode.Intersect, canCombine)}
        />
      </Tool>
      <Tool
        name={t("Invert Annotation")}
        onClick={() => handleModeSelection(AnnotationMode.Invert)}
        disabled={!canInvert}
        selected={annotationMode === AnnotationMode.Invert}
        tooltipLocation="left"
      >
        <SvgIcon sx={{ color: iconColor(AnnotationMode.Invert, canInvert) }}>
          <FilterBAndW />
        </SvgIcon>
      </Tool>
    </Stack>
  );
};
