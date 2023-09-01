import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { List, ListSubheader, Radio, RadioGroup } from "@mui/material";

import { useTranslation } from "hooks";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";

import { annotatorSlice } from "store/annotator";
import {
  selectAnnotationState,
  selectAnnotationSelectionMode,
} from "store/annotator/selectors";
import { selectWorkingAnnotation } from "store/imageViewer";

import { AnnotationModeType, AnnotationStateType } from "types";

import { RadioCheckedIcon, RadioUncheckedIcon } from "icons";

export const AnnotationMode = () => {
  const dispatch = useDispatch();

  const annotationMode = useSelector(selectAnnotationSelectionMode);

  const annotationState = useSelector(selectAnnotationState);

  const workingAnnotation = useSelector(selectWorkingAnnotation);

  const [disableAnnotationEdits, setDisabledAnnotationEdit] =
    React.useState(true);

  React.useEffect(() => {
    if (
      workingAnnotation.saved ||
      annotationState === AnnotationStateType.Annotated
    ) {
      setDisabledAnnotationEdit(false);
    } else {
      setDisabledAnnotationEdit(true);
    }
  }, [workingAnnotation, annotationState, dispatch]);

  const onClickLabel = (event: any, mode: AnnotationModeType) => {
    const payload = {
      selectionMode: mode,
    };
    dispatch(annotatorSlice.actions.setSelectionMode(payload));
  };

  const t = useTranslation();

  return (
    <RadioGroup
      aria-label="annotation mode"
      name="annotation-mode"
      value={annotationMode}
    >
      <List
        component="nav"
        subheader={
          <ListSubheader component="div">{t("Annotation mode")}</ListSubheader>
        }
      >
        <CustomListItemButton
          primaryText={t("New")}
          icon={
            <Radio
              disableRipple
              edge="start"
              icon={<RadioUncheckedIcon />}
              checkedIcon={<RadioCheckedIcon />}
              tabIndex={-1}
              value={AnnotationModeType.New}
              sx={{ py: 0 }}
            />
          }
          onClick={(event) => onClickLabel(event, AnnotationModeType.New)}
          tooltipText={"Create a new annotation."}
          disabled={disableAnnotationEdits}
          dense
        />

        <CustomListItemButton
          primaryText={t("Add")}
          icon={
            <Radio
              disableRipple
              edge="start"
              icon={<RadioUncheckedIcon />}
              checkedIcon={<RadioCheckedIcon />}
              tabIndex={-1}
              value={AnnotationModeType.Add}
              sx={{ py: 0 }}
            />
          }
          onClick={(event) => onClickLabel(event, AnnotationModeType.Add)}
          tooltipText="Adding to an annotation adds any new areas you annotate to an existing annotation."
          disabled={disableAnnotationEdits}
          dense
        />

        <CustomListItemButton
          primaryText={t("Subtract")}
          icon={
            <Radio
              disableRipple
              edge="start"
              icon={<RadioUncheckedIcon />}
              checkedIcon={<RadioCheckedIcon />}
              tabIndex={-1}
              value={AnnotationModeType.Subtract}
              sx={{ py: 0 }}
            />
          }
          onClick={(event) => onClickLabel(event, AnnotationModeType.Subtract)}
          tooltipText="Remove the area you label from an existing annotation."
          disabled={disableAnnotationEdits}
          dense
        />

        <CustomListItemButton
          primaryText={t("Intersection")}
          icon={
            <Radio
              disableRipple
              edge="start"
              icon={<RadioUncheckedIcon />}
              checkedIcon={<RadioCheckedIcon />}
              tabIndex={-1}
              value={AnnotationModeType.Intersect}
              sx={{ py: 0 }}
            />
          }
          onClick={(event) => onClickLabel(event, AnnotationModeType.Intersect)}
          tooltipText="Constrain the boundary of the new annotation to the selected annotation."
          disabled={disableAnnotationEdits}
          dense
        />
      </List>
    </RadioGroup>
  );
};
