import * as React from "react";
import {
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper
} from "@material-ui/core";
import LabelIcon from "@material-ui/icons/Label";
import LabelOutlinedIcon from "@material-ui/icons/LabelOutlined";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import StyledCategory from "./StyledCategory";
import {styles} from "./CategoryListItem.css";
import {makeStyles} from "@material-ui/styles";
import {useMenu} from "@piximi/hooks";
import {ConnectedCategoryDropTarget} from "../../CategoryDropTarget/ConnectedCategoryDropTarget";
import {CategoryListItemMenuList} from "../CategoryListItemMenuList";
import {Category} from "@piximi/types";

const useStyles = makeStyles(styles);

type VisibleIconProps = {
  color: string;
  visible: boolean;
};

const VisibleIcon = (props: VisibleIconProps) => {
  const {color, visible} = props;

  if (visible) {
    return <LabelIcon style={{color: color}} />;
  } else {
    return <LabelOutlinedIcon style={{color: color}} />;
  }
};

type CategoryListItemProps = {
  categories: Category[];
  category: Category;
  key: string;
  index: number;
  toggleVisibility: (category: Category) => void;
};

export const CategoryListItem = (props: CategoryListItemProps) => {
  const {categories, category, toggleVisibility} = props;

  const {anchorEl, openedMenu, openMenu, closeMenu} = useMenu();

  const [animateOnDrop, setAnimateOnDrop] = React.useState<Partial<boolean>>();

  const onToggleVisibilityClick = () => {
    toggleVisibility(category);
  };

  const className =
    animateOnDrop !== null
      ? animateOnDrop
        ? "onDropPulse"
        : "onDropPulse2"
      : "";

  const onDrop = () => {
    setAnimateOnDrop(!animateOnDrop);
  };

  const listItemClasses = {
    root: ""
  };

  return (
    <ConnectedCategoryDropTarget category={category}>
      <StyledCategory
        color={category.visualization.color}
        onDrop={onDrop}
        className={className}
      >
        <ListItem classes={listItemClasses} dense style={{cursor: "pointer"}}>
          <ListItemIcon onClick={onToggleVisibilityClick}>
            <VisibleIcon
              color={category.visualization.color}
              visible={category.visualization.visible}
            />
          </ListItemIcon>

          <ListItemText primary={category.description} />

          <ListItemSecondaryAction>
            <IconButton onClick={openMenu}>
              <MoreHorizIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      </StyledCategory>

      <CategoryListItemMenuList
        anchorEl={anchorEl}
        categories={categories}
        category={category}
        closeMenu={closeMenu}
        openedMenu={openedMenu}
      />
    </ConnectedCategoryDropTarget>
  );
};
