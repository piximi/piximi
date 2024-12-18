import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { List, ListSubheader, Radio, RadioGroup } from "@mui/material";

import { useTranslation } from "hooks";

import { CustomListItemButton } from "components/ui";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  selectAnnotationState,
  selectAnnotationSelectionMode,
  selectWorkingAnnotation,
} from "views/ImageViewer/state/annotator/selectors";

import { RadioCheckedIcon, RadioUncheckedIcon } from "icons";

import { AnnotationMode, AnnotationState } from "utils/annotator/enums";

export const AnnotationModeOptions = () => {
  const dispatch = useDispatch();

  const annotationMode = useSelector(selectAnnotationSelectionMode);

  const annotationState = useSelector(selectAnnotationState);

  const workingAnnotation = useSelector(selectWorkingAnnotation);

  const [disableAnnotationEdits, setDisabledAnnotationEdit] =
    React.useState(true);

  React.useEffect(() => {
    if (
      workingAnnotation.saved ||
      annotationState === AnnotationState.Annotated
    ) {
      setDisabledAnnotationEdit(false);
    } else {
      setDisabledAnnotationEdit(true);
    }
  }, [workingAnnotation, annotationState, dispatch]);

  const onClickLabel = (event: any, mode: AnnotationMode) => {
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
              value={AnnotationMode.New}
              sx={{ py: 0 }}
            />
          }
          onClick={(event) => onClickLabel(event, AnnotationMode.New)}
          tooltipText={"Create a new annotation."}
          disabled={disableAnnotationEdits}
          sx={{
            "&.Mui-disabled": {
              opacity: 0.8,
            },
          }}
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
              value={AnnotationMode.Add}
              sx={{ py: 0 }}
            />
          }
          onClick={(event) => onClickLabel(event, AnnotationMode.Add)}
          tooltipText="Adds new areas to an existing annotation."
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
              value={AnnotationMode.Subtract}
              sx={{ py: 0 }}
            />
          }
          onClick={(event) => onClickLabel(event, AnnotationMode.Subtract)}
          tooltipText="Remove area from an existing annotation."
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
              value={AnnotationMode.Intersect}
              sx={{ py: 0 }}
            />
          }
          onClick={(event) => onClickLabel(event, AnnotationMode.Intersect)}
          tooltipText="Constrain the boundary of the new annotation to the selected annotation."
          disabled={disableAnnotationEdits}
          dense
        />
      </List>
    </RadioGroup>
  );
};
