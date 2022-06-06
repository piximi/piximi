import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Radio from "@mui/material/Radio";
import React from "react";
import RadioGroup from "@mui/material/RadioGroup";
import { useDispatch, useSelector } from "react-redux";
import {
  annotationStateSelector,
  selectionModeSelector,
} from "../../../../../store/selectors";
import { AnnotationModeType } from "../../../../../types/AnnotationModeType";
import ListSubheader from "@mui/material/ListSubheader";
import { NewTooltip } from "../NewTooltip";
import { AddTooltip } from "../AddTooltip";
import { SubtractTooltip } from "../SubtractTooltip";
import { IntersectionTooltip } from "../IntersectionTooltip";
import { RadioCheckedIcon, RadioUncheckedIcon } from "../../../../../icons";
import { useTranslation } from "../../../../../hooks/useTranslation";
import { imageViewerSlice } from "../../../../../store/slices";
import { AnnotationStateType } from "../../../../../types/AnnotationStateType";

export const AnnotationMode = () => {
  const dispatch = useDispatch();

  const annotationMode = useSelector(selectionModeSelector);

  const annotationState = useSelector(annotationStateSelector);

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
            //disabled={annotationState === AnnotationStateType.Blank}
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
            disabled={annotationState === AnnotationStateType.Blank}
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
            disabled={annotationState === AnnotationStateType.Blank}
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
