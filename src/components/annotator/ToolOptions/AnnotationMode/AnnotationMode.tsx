import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Radio,
  RadioGroup,
  Tooltip,
} from "@mui/material";

import { useTranslation } from "hooks";

import { annotatorSlice } from "store/annotator";
import {
  selectAnnotationState,
  selectAnnotationSelectionMode,
} from "store/annotator/selectors";
import { selectWorkingAnnotation } from "store/data";

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
      workingAnnotation ||
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
        <Tooltip
          title="Create a new annotation."
          placement="bottom"
          disableInteractive
        >
          <ListItemButton
            dense
            onClick={(event) => onClickLabel(event, AnnotationModeType.New)}
          >
            <ListItemIcon>
              <Radio
                disableRipple
                edge="start"
                icon={<RadioUncheckedIcon />}
                checkedIcon={<RadioCheckedIcon />}
                tabIndex={-1}
                value={AnnotationModeType.New}
              />
            </ListItemIcon>

            <ListItemText primary={t("New annotation")} />
          </ListItemButton>
        </Tooltip>

        <Tooltip
          title="Adding to an annotation adds any new areas you annotate to an existing annotation."
          placement="bottom"
          disableInteractive
        >
          <ListItemButton
            dense
            onClick={(event) => onClickLabel(event, AnnotationModeType.Add)}
            disabled={disableAnnotationEdits}
          >
            <ListItemIcon>
              <Radio
                disableRipple
                edge="start"
                icon={<RadioUncheckedIcon />}
                checkedIcon={<RadioCheckedIcon />}
                tabIndex={-1}
                value={AnnotationModeType.Add}
              />
            </ListItemIcon>

            <ListItemText primary={t("Add area")} />
          </ListItemButton>
        </Tooltip>

        <Tooltip
          title="Remove the area you label from an existing annotation."
          placement="bottom"
          disableInteractive
        >
          <ListItemButton
            dense
            onClick={(event) =>
              onClickLabel(event, AnnotationModeType.Subtract)
            }
            disabled={disableAnnotationEdits}
          >
            <ListItemIcon>
              <Radio
                disableRipple
                edge="start"
                icon={<RadioUncheckedIcon />}
                checkedIcon={<RadioCheckedIcon />}
                tabIndex={-1}
                value={AnnotationModeType.Subtract}
              />
            </ListItemIcon>

            <ListItemText primary={t("Subtract area")} />
          </ListItemButton>
        </Tooltip>

        <Tooltip
          title="Constrain the boundary of the new annotation to the selected annotation."
          placement="bottom"
          disableInteractive
        >
          <ListItemButton
            dense
            onClick={(event) =>
              onClickLabel(event, AnnotationModeType.Intersect)
            }
            disabled={disableAnnotationEdits}
          >
            <ListItemIcon>
              <Radio
                disableRipple
                edge="start"
                icon={<RadioUncheckedIcon />}
                checkedIcon={<RadioCheckedIcon />}
                tabIndex={-1}
                value={AnnotationModeType.Intersect}
              />
            </ListItemIcon>

            <ListItemText primary={t("Intersection")} />
          </ListItemButton>
        </Tooltip>
      </List>
    </RadioGroup>
  );
};
