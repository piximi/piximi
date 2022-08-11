import React from "react";

import {
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material";

import { CheckboxCheckedIcon, CheckboxUncheckedIcon } from "icons";

export const SampleList = () => {
  const [checked, setChecked] = React.useState([0, 1, 2]);

  const onChange = (index: number) => () => {
    const current = checked.indexOf(index);

    const updated = [...checked];

    if (current === -1) {
      updated.push(index);
    } else {
      updated.splice(current, 1);
    }

    setChecked(updated);
  };

  return (
    <List
      component="nav"
      subheader={<ListSubheader component="div">Sample</ListSubheader>}
    >
      <ListItem button dense onClick={onChange(0)}>
        <ListItemIcon>
          <Checkbox
            checked={checked.indexOf(0) !== -1}
            disableRipple
            edge="start"
            icon={<CheckboxUncheckedIcon />}
            checkedIcon={<CheckboxCheckedIcon />}
            tabIndex={-1}
          />
        </ListItemIcon>

        <ListItemText primary="Red" />
      </ListItem>

      <ListItem button dense onClick={onChange(1)}>
        <ListItemIcon>
          <Checkbox
            checked={checked.indexOf(1) !== -1}
            disableRipple
            edge="start"
            icon={<CheckboxUncheckedIcon />}
            checkedIcon={<CheckboxCheckedIcon />}
            tabIndex={-1}
          />
        </ListItemIcon>

        <ListItemText primary="Green" />
      </ListItem>

      <ListItem button dense onClick={onChange(2)}>
        <ListItemIcon>
          <Checkbox
            checked={checked.indexOf(2) !== -1}
            disableRipple
            edge="start"
            icon={<CheckboxUncheckedIcon />}
            checkedIcon={<CheckboxCheckedIcon />}
            tabIndex={-1}
          />
        </ListItemIcon>

        <ListItemText primary="Blue" />
      </ListItem>
    </List>
  );
};
