import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Radio from "@mui/material/Radio";
import React from "react";
import RadioGroup from "@mui/material/RadioGroup";
import { useDispatch, useSelector } from "react-redux";
import { selectionModeSelector } from "../../../../../annotator/store/selectors";
import { applicationSlice } from "../../../../../annotator/store";
import { AnnotationModeType } from "../../../../../annotator/types/AnnotationModeType";
import ListSubheader from "@mui/material/ListSubheader";
import { NewTooltip } from "../NewTooltip";
import { AddTooltip } from "../AddTooltip";
import { SubtractTooltip } from "../SubtractTooltip";
import { IntersectionTooltip } from "../IntersectionTooltip";
import { RadioCheckedIcon, RadioUncheckedIcon } from "../../../../../icons";
import { useTranslation } from "../../../../../annotator/hooks/useTranslation";

export const AnnotationMode = () => {
  const dispatch = useDispatch();

  const annotationMode = useSelector(selectionModeSelector);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const payload = {
      selectionMode: parseInt((event.target as HTMLInputElement).value),
    };
    dispatch(applicationSlice.actions.setSelectionMode(payload));
  };

  const onClickLabel = (event: any, mode: AnnotationModeType) => {
    const payload = {
      selectionMode: mode,
    };
    dispatch(applicationSlice.actions.setSelectionMode(payload));
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
          <ListItem
            button
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
          </ListItem>
        </NewTooltip>

        <AddTooltip>
          <ListItem
            button
            dense
            onClick={(event) => onClickLabel(event, AnnotationModeType.Add)}
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
          </ListItem>
        </AddTooltip>

        <SubtractTooltip>
          <ListItem
            button
            dense
            onClick={(event) =>
              onClickLabel(event, AnnotationModeType.Subtract)
            }
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
          </ListItem>
        </SubtractTooltip>

        <IntersectionTooltip>
          <ListItem
            button
            dense
            onClick={(event) =>
              onClickLabel(event, AnnotationModeType.Intersect)
            }
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
          </ListItem>
        </IntersectionTooltip>
      </List>
    </RadioGroup>
  );
};
