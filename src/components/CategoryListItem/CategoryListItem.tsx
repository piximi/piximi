import React from "react";
import { Category, CategoryType } from "types/Category";
import { CategoryListItemCheckbox } from "../CategoryListItemCheckbox";
import { CategoryMenu } from "../CategoryMenu";
import { useSelector } from "react-redux";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { State } from "types/State";
import { ImageType } from "types/ImageType";
import {
  Chip,
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from "@mui/material";
import { categoryCountsSelector } from "store/selectors";

type CategoryListItemProps = {
  categoryType: CategoryType;
  category: Category;
  id: string;
};

export const CategoryListItem = ({
  categoryType,
  category,
  id,
}: CategoryListItemProps) => {
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const onOpenCategoryMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const imageCount = useSelector((state: State) => {
    return state.project.images.filter((image: ImageType) => {
      return image.categoryId === category.id;
    }).length;
  });

  const categoryCounts = useSelector(categoryCountsSelector);

  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    categoryType === CategoryType.ClassifierCategory
      ? setCount(imageCount)
      : setCount(categoryCounts[category.id]);
  }, [category.id, categoryCounts, categoryType, imageCount]);

  return (
    <React.Fragment>
      <ListItem dense key={id} id={id}>
        <CategoryListItemCheckbox
          category={category}
          categoryType={categoryType}
        />

        <ListItemText
          id={id}
          primary={category.name}
          primaryTypographyProps={{ noWrap: true }}
        />

        <Chip
          label={count}
          size="small"
          sx={{
            height: "20px",
            borderWidth: "2px",
            fontSize: "0.875rem",
            color: "white",
            backgroundColor: category.color,
          }}
        />

        <ListItemSecondaryAction>
          <IconButton edge="end" onClick={onOpenCategoryMenu}>
            <MoreHorizIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>

      <CategoryMenu
        anchorElCategoryMenu={categoryMenuAnchorEl}
        category={category}
        categoryType={categoryType}
        onCloseCategoryMenu={onCloseCategoryMenu}
        onOpenCategoryMenu={onOpenCategoryMenu}
        openCategoryMenu={Boolean(categoryMenuAnchorEl)}
      />
    </React.Fragment>
  );
};
