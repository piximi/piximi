import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import Checkbox from "@mui/material/Checkbox";
import LabelIcon from "@mui/icons-material/Label";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

export const UnknownCategoryListItem = () => {
  const id = "00000000-0000-0000-0000-000000000000";

  return (
    <>
      <ListItem dense key={id} id={id}>
        <ListItemIcon>
          <Checkbox
            checked
            checkedIcon={<LabelIcon style={{ color: "#AAAAAA" }} />}
            disableRipple
            edge="start"
            icon={<LabelOutlinedIcon style={{ color: "#AAAAAA" }} />}
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
