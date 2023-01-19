import React from "react";

import {
  Checkbox,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";

import {
  LabelOutlined as LabelOutlinedIcon,
  Label as LabelIcon,
  MoreHoriz as MoreHorizIcon,
} from "@mui/icons-material";

import { UNKNOWN_CLASS_CATEGORY_ID } from "types";

import { UNKNOWN_CLASS_CATEGORY_COLOR } from "colorPalette";

export const UnknownCategoryListItem = () => {
  const id = UNKNOWN_CLASS_CATEGORY_ID;

  return (
    <>
      <ListItem dense key={id} id={id}>
        <ListItemIcon>
          <Checkbox
            checked
            checkedIcon={
              <LabelIcon style={{ color: UNKNOWN_CLASS_CATEGORY_COLOR }} />
            }
            disableRipple
            edge="start"
            icon={
              <LabelOutlinedIcon
                style={{ color: UNKNOWN_CLASS_CATEGORY_COLOR }}
              />
            }
            tabIndex={-1}
          />
        </ListItemIcon>

        <ListItemText id={id} primary="Unknown" />

        <ListItemSecondaryAction>
          <IconButton edge="end">
            <MoreHorizIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    </>
  );
};
