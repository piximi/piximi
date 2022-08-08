import React from "react";

import { ListItem, ListItemIcon, ListItemText, Radio } from "@mui/material";

import { Label as LabelIcon } from "@mui/icons-material";

import { Category } from "types";

type CategorySelectionItemProps = {
  category: Category;
  active: Category;
  setActive: (newCategory: Category) => void;
};

export const CategorySelectionItem = ({
  category,
  active,
  setActive,
}: CategorySelectionItemProps) => {
  const handleChange = () => {
    setActive(category);
  };

  return (
    <ListItem dense={false} key={category.id} id={category.id}>
      <ListItemIcon>
        <Radio
          disableRipple
          checked={active.id === category.id}
          onChange={handleChange}
          edge="start"
          tabIndex={-1}
          style={{
            padding: "2px",
            paddingTop: "2px",
            paddingBottom: "2px",
            marginLeft: "0px",
          }}
        />
      </ListItemIcon>

      <ListItemText
        id={category.id}
        primary={category.name}
        primaryTypographyProps={{ noWrap: true }}
      />

      <LabelIcon style={{ color: category.color, transform: "scaleX(-1)" }} />
    </ListItem>
  );
};
