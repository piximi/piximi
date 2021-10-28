import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { invertModeSelector } from "../../../../annotator/store/selectors";
import { applicationSlice } from "../../../../annotator/store/slices";
import { useTranslation } from "../../../../annotator/hooks/useTranslation";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import SvgIcon from "@mui/material/SvgIcon";
import { ReactComponent as InvertSelectionIcon } from "../../../../icons/InvertAnnotation.svg";
import ListItemText from "@mui/material/ListItemText";

export const InvertAnnotation = () => {
  const dispatch = useDispatch();

  const invertMode = useSelector(invertModeSelector);

  const onInvertClick = () => {
    dispatch(
      applicationSlice.actions.setInvertMode({ invertMode: !invertMode })
    );
  };

  const t = useTranslation();

  return (
    <List>
      <ListItem button onClick={onInvertClick} dense>
        <ListItemIcon>
          <SvgIcon>
            <InvertSelectionIcon />
          </SvgIcon>
        </ListItemIcon>

        <ListItemText primary={t("Invert annotation")} />
      </ListItem>
    </List>
  );
};
