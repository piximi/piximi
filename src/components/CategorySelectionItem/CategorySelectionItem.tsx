import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import React from "react";
import { Category } from "../../types/Category";
import Radio from "@material-ui/core/Radio";
import LabelIcon from "@material-ui/icons/Label";
import ListItemIcon from "@material-ui/core/ListItemIcon";

type CategorySelectionItemProps = {
  category: Category;
  active: string;
  setActive: (id: string) => void;
};

export const CategorySelectionItem = ({
  category,
  active,
  setActive,
}: CategorySelectionItemProps) => {
  const handleChange = () => {
    setActive(category.id);
  };

  return (
    <React.Fragment>
      <ListItem dense key={category.id} id={category.id}>
        <ListItemIcon>
          <Radio
            disableRipple
            checked={active === category.id}
            onChange={handleChange}
            edge="start"
            tabIndex={-1}
          />
        </ListItemIcon>

        <ListItemText
          id={category.id}
          primary={category.name}
          primaryTypographyProps={{ noWrap: true }}
        />

        <LabelIcon style={{ color: category.color, transform: "scaleX(-1)" }} />
      </ListItem>
    </React.Fragment>
  );
};
