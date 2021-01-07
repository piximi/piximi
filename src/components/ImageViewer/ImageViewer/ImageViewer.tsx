import AppBar from "@material-ui/core/AppBar";
import Box from "@material-ui/core/Box";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Radio from "@material-ui/core/Radio";
import React, { useState } from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import Toolbar from "@material-ui/core/Toolbar";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import { Category } from "../../../types/Category";
import { CssBaseline } from "@material-ui/core";
import { EllipticalSelection } from "../EllipticalSelection";
import { Image } from "../../../types/Image";
import { LassoSelection } from "../LassoSelection/LassoSelection";
import { MagneticSelection } from "../MagneticSelection";
import { PolygonalSelection } from "../PolygonalSelection/PolygonalSelection";
import { ReactComponent as EllipticalIcon } from "../../../icons/Elliptical.svg";
import { ReactComponent as InvertSelectionIcon } from "../../../icons/InvertSelection.svg";
import { ReactComponent as LassoIcon } from "../../../icons/Lasso.svg";
import { ReactComponent as MagicWandIcon } from "../../../icons/MagicWand.svg";
import { ReactComponent as MagneticIcon } from "../../../icons/Magnetic.svg";
import { ReactComponent as QuickIcon } from "../../../icons/Quick.svg";
import { ReactComponent as RectangularIcon } from "../../../icons/Rectangular.svg";
import { RectangularSelection } from "../RectangularSelection";
import { SelectionMethod } from "../../../types/SelectionMethod";
import { SelectionType } from "../../../types/SelectionType";
import {
  createdCategoriesSelector,
  imagesSelector,
  unknownCategorySelector,
} from "../../../store/selectors";
import { useDispatch, useSelector } from "react-redux";
import { useStyles } from "./ImageViewer.css";
import { CollapsibleList } from "../../CollapsibleList";
import { CreateCategoryListItem } from "../../CreateCategoryListItem";
import { CategoryListItemCheckbox } from "../../CategoryListItemCheckbox";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import { CategoryMenu } from "../../CategoryMenu";
import { DeleteCategoryDialog } from "../../DeleteCategoryDialog";
import { EditCategoryDialog } from "../../EditCategoryDialog";
import { useDialog, useMenu } from "../../../hooks";
import { projectSlice } from "../../../store/slices";

const operations = [
  {
    icon: <RectangularIcon />,
    method: SelectionMethod.Rectangular,
    name: "Rectangular selection",
  },
  {
    icon: <EllipticalIcon />,
    method: SelectionMethod.Elliptical,
    name: "Elliptical selection",
  },
  {
    icon: <EllipticalIcon />,
    method: SelectionMethod.Polygonal,
    name: "Polygonal selection",
  },
  {
    icon: <LassoIcon />,
    method: SelectionMethod.Lasso,
    name: "Lasso selection",
  },
  {
    icon: <MagneticIcon />,
    method: SelectionMethod.Magnetic,
    name: "Magnetic selection",
  },
  {
    icon: <MagicWandIcon />,
    method: SelectionMethod.Color,
    name: "Color selection",
  },
  {
    icon: <QuickIcon />,
    method: SelectionMethod.Quick,
    name: "Quick selection",
  },
];

type ImageViewerStageProps = {
  operation: SelectionMethod;
  data: Image;
  category: Category;
};

const ImageViewerStage = ({
  operation,
  data,
  category,
}: ImageViewerStageProps) => {
  if (data && data.shape && data.src) {
    switch (operation) {
      case SelectionMethod.Color:
        return <React.Fragment />;
      case SelectionMethod.Elliptical:
        return <EllipticalSelection data={data} category={category} />;
      case SelectionMethod.Lasso:
        return <LassoSelection image={data} category={category} />;
      case SelectionMethod.Magnetic:
        return <MagneticSelection image={data} />;
      case SelectionMethod.Object:
        return <React.Fragment />;
      case SelectionMethod.Polygonal:
        return <PolygonalSelection image={data} category={category} />;
      case SelectionMethod.Quick:
        return <React.Fragment />;
      case SelectionMethod.Rectangular:
        return <RectangularSelection data={data} category={category} />;
      default:
        return <React.Fragment />;
    }
  } else {
    return <React.Fragment />;
  }
};

type ImageViewerProps = {
  foo: Image;
};

export const ImageViewer = ({ foo }: ImageViewerProps) => {
  const dispatch = useDispatch();

  // TODO: Testing code, please remove ASAP
  React.useEffect(() => {
    const payload = { shape: foo.shape!, src: foo.src };

    dispatch(projectSlice.actions.createImage(payload));
  }, [foo, dispatch]);

  const images = useSelector(imagesSelector);

  const [active, setActive] = useState<SelectionMethod>(
    SelectionMethod.Rectangular
  );

  const classes = useStyles();

  const categories = useSelector(createdCategoriesSelector);
  const unknownCategory = useSelector(unknownCategorySelector);

  const [activeCategory, setActiveCategory] = useState<Category>(
    unknownCategory
  );

  const {
    onClose: onCloseDeleteCategoryDialog,
    onOpen: onOpenDeleteCategoryDialog,
    open: openDeleteCategoryDialog,
  } = useDialog();
  const {
    onClose: onCloseEditCategoryDialog,
    onOpen: onOpenEditCategoryDialog,
    open: openEditCategoryDialog,
  } = useDialog();

  const {
    anchorEl: anchorElCategoryMenu,
    onClose: onCloseCategoryMenu,
    onOpen: onOpenCategoryMenu,
    open: openCategoryMenu,
  } = useMenu();

  const onCategoryClick = (
    event: React.MouseEvent<HTMLDivElement>,
    category: Category
  ) => {
    setActiveCategory(category);
  };

  return (
    <div className={classes.root}>
      <CssBaseline />

      <AppBar className={classes.appBar} color="inherit" position="fixed">
        <Toolbar>
          <Typography className={classes.logo} variant="h6">
            <strong>Piximi</strong> Image viewer
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        className={classes.applicationDrawer}
        classes={{ paper: classes.applicationDrawerPaper }}
        open
        variant="persistent"
      >
        <div className={classes.applicationDrawerHeader} />

        <CollapsibleList primary="Categories">
          {categories.map((category: Category) => {
            return (
              <React.Fragment>
                <ListItem
                  button
                  dense
                  id={category.id}
                  key={category.id}
                  onClick={(event) => onCategoryClick(event, category)}
                  selected={category.id === activeCategory.id}
                >
                  <CategoryListItemCheckbox category={category} />

                  <ListItemText
                    id={category.id}
                    primary={category.name}
                    primaryTypographyProps={{ noWrap: true }}
                  />

                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={onOpenCategoryMenu}>
                      <MoreHorizIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>

                <CategoryMenu
                  anchorElCategoryMenu={anchorElCategoryMenu}
                  category={category}
                  onCloseCategoryMenu={onCloseCategoryMenu}
                  onOpenCategoryMenu={onOpenCategoryMenu}
                  onOpenDeleteCategoryDialog={onOpenDeleteCategoryDialog}
                  onOpenEditCategoryDialog={onOpenEditCategoryDialog}
                  openCategoryMenu={openCategoryMenu}
                />

                <DeleteCategoryDialog
                  category={category}
                  onClose={onCloseDeleteCategoryDialog}
                  open={openDeleteCategoryDialog}
                />

                <EditCategoryDialog
                  category={category}
                  onCloseDialog={onCloseEditCategoryDialog}
                  openDialog={openEditCategoryDialog}
                />
              </React.Fragment>
            );
          })}

          <ListItem
            button
            dense
            id={unknownCategory.id}
            key={unknownCategory.id}
            onClick={(event) => onCategoryClick(event, unknownCategory)}
            selected={unknownCategory.id === activeCategory.id}
          >
            <CategoryListItemCheckbox category={unknownCategory} />

            <ListItemText
              id={unknownCategory.id}
              primary={unknownCategory.name}
              primaryTypographyProps={{ noWrap: true }}
            />
          </ListItem>

          <CreateCategoryListItem />
        </CollapsibleList>
      </Drawer>

      <main className={classes.content}>
        <div className={classes.toolbar} />

        <Box alignItems="center" display="flex" justifyContent="center">
          <ImageViewerStage
            operation={active}
            data={images[0]}
            category={activeCategory}
          />
        </Box>
      </main>

      <Drawer
        anchor="right"
        className={classes.settings}
        classes={{ paper: classes.settingsPaper }}
        variant="permanent"
      >
        <div className={classes.settingsToolbar} />

        <List>
          <ListItem dense>
            <ListItemText
              primary={
                operations[
                  operations.findIndex(
                    (operation) => operation.method === active
                  )
                ].name
              }
              secondary="Nam a facilisis velit, sit amet interdum ante. In sodales."
            />
          </ListItem>
        </List>

        <Divider />

        <List>
          <ListItem dense disabled>
            <ListItemIcon>
              <Radio disableRipple disabled edge="start" tabIndex={-1} />
            </ListItemIcon>

            <ListItemText
              primary={SelectionType.New}
              secondary="Create a new selection."
            />
          </ListItem>

          <ListItem dense disabled>
            <ListItemIcon>
              <Radio disableRipple disabled edge="start" tabIndex={-1} />
            </ListItemIcon>

            <ListItemText
              primary={SelectionType.Addition}
              secondary="Add area to the existing selection."
            />
          </ListItem>

          <ListItem dense disabled>
            <ListItemIcon>
              <Radio disableRipple disabled edge="start" tabIndex={-1} />
            </ListItemIcon>

            <ListItemText
              primary={SelectionType.Subtraction}
              secondary="Subtract area from the existing selection."
            />
          </ListItem>

          <ListItem dense disabled>
            <ListItemIcon>
              <Radio disableRipple disabled edge="start" tabIndex={-1} />
            </ListItemIcon>

            <ListItemText
              primary={SelectionType.Intersection}
              secondary="Constrain the boundary of the new selection to the existing selection."
            />
          </ListItem>
        </List>

        <Divider />

        <List>
          <ListItem button dense>
            <ListItemIcon>
              <SvgIcon>
                <InvertSelectionIcon />
              </SvgIcon>
            </ListItemIcon>

            <ListItemText primary="Invert selection" />
          </ListItem>
        </List>
      </Drawer>

      <Drawer
        anchor="right"
        className={classes.operations}
        classes={{ paper: classes.operationsPaper }}
        variant="permanent"
      >
        <div className={classes.operationsToolbar} />

        <Divider />

        <List>
          {operations.map((operation, index) => {
            return (
              <Tooltip
                aria-label={operation.name}
                key={index}
                title={operation.name}
              >
                <ListItem
                  button
                  onClick={() => setActive(operation.method)}
                  selected={active === operation.method}
                >
                  <ListItemIcon>
                    <SvgIcon fontSize="small">{operation.icon}</SvgIcon>
                  </ListItemIcon>
                </ListItem>
              </Tooltip>
            );
          })}
        </List>
      </Drawer>
    </div>
  );
};
