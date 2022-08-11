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
} from "@mui/material";

import { useTranslation } from "hooks";

import { NewTooltip } from "../NewTooltip";
import { AddTooltip } from "../AddTooltip";
import { SubtractTooltip } from "../SubtractTooltip";
import { IntersectionTooltip } from "../IntersectionTooltip";

import {
  annotationStateSelector,
  selectedAnnotationSelector,
  selectionModeSelector,
} from "store/selectors";

import { imageViewerSlice } from "store/slices";

import { AnnotationModeType, AnnotationStateType } from "types";

import { RadioCheckedIcon, RadioUncheckedIcon } from "icons";

export const AnnotationMode = () => {
  const dispatch = useDispatch();

  const annotationMode = useSelector(selectionModeSelector);

  const annotationState = useSelector(annotationStateSelector);

  const selectedAnnotation = useSelector(selectedAnnotationSelector);

  const [disableAnnotationEdits, setDisabledAnnotationEdit] =
    React.useState(true);

  React.useEffect(() => {
    if (
      selectedAnnotation ||
      annotationState === AnnotationStateType.Annotated
    ) {
      setDisabledAnnotationEdit(false);
    } else {
      setDisabledAnnotationEdit(true);
      dispatch(
        imageViewerSlice.actions.setSelectionMode({
          selectionMode: AnnotationModeType.New,
        })
      );
    }
  }, [selectedAnnotation, annotationState, dispatch]);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const payload = {
      selectionMode: parseInt((event.target as HTMLInputElement).value),
    };
    dispatch(imageViewerSlice.actions.setSelectionMode(payload));
  };

  const onClickLabel = (event: any, mode: AnnotationModeType) => {
    const payload = {
      selectionMode: mode,
    };
    dispatch(imageViewerSlice.actions.setSelectionMode(payload));
  };

  const t = useTranslation();

  return (
    <RadioGroup
      aria-label="annotation mode"
      name="annotation-mode"
      onChange={onChange}
      value={annotationMode}
    >
      <List
        component="nav"
        subheader={
          <ListSubheader component="div">{t("Annotation mode")}</ListSubheader>
        }
      >
        <NewTooltip>
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
        </NewTooltip>

        <AddTooltip>
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
        </AddTooltip>

        <SubtractTooltip>
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
        </SubtractTooltip>

        <IntersectionTooltip>
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
        </IntersectionTooltip>
      </List>
    </RadioGroup>
  );
};
