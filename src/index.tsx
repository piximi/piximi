import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";
import CssBaseline from "@material-ui/core/CssBaseline";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";
import IconButton from "@material-ui/core/IconButton";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MenuList from "@material-ui/core/MenuList";
import Slide from "@material-ui/core/Slide";
import TextField from "@material-ui/core/TextField";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import useTheme from "@material-ui/core/styles/useTheme";

import AddIcon from "@material-ui/icons/Add";
import CloseIcon from "@material-ui/icons/Close";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import FeedbackIcon from "@material-ui/icons/Feedback";
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import HelpIcon from "@material-ui/icons/Help";
import LabelOutlinedIcon from "@material-ui/icons/LabelOutlined";
import MenuIcon from "@material-ui/icons/Menu";
import SaveIcon from "@material-ui/icons/Save";
import SettingsIcon from "@material-ui/icons/Settings";

import React from "react";
import ReactDOM from "react-dom";

import * as serviceWorker from "./serviceWorker";
import { useStyles } from "./index.css";
import clsx from "clsx";
import {
  bindMenu,
  bindTrigger,
  usePopupState,
} from "material-ui-popup-state/hooks";
import { TransitionProps } from "@material-ui/core/transitions";
import { Provider, useSelector } from "react-redux";
import { ImageDialog } from "./ImageDialog";
import { CollapsibleList } from "./CollapsibleList";
import { Category, Image, State, store } from "./store";
import { CategoriesList } from "./CategoriesList";

const DialogTransition = React.forwardRef(
  (
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>
  ) => {
    return <Slide direction="right" ref={ref} {...props} />;
  }
);

const Application = () => {
  const categories = useSelector((state: State) => {
    return state.project.categories;
  });

  const images = useSelector((state: State) => {
    return state.project.images;
  });

  /*
   * Drawer
   */
  const [openDrawer, setOpenDrawer] = React.useState(true);

  const onOpenDrawer = () => {
    setOpenDrawer(true);
  };

  const onCloseDrawer = () => {
    setOpenDrawer(false);
  };

  /*
   * New classifier dialog
   */
  const [openNewClassifierDialog, setOpenNewClassifierDialog] = React.useState(
    false
  );

  const onOpenNewClassifierDialog = () => {
    setOpenNewClassifierDialog(true);
  };

  const onCloseNewClassifierDialog = () => {
    setOpenNewClassifierDialog(false);
  };

  const openMenuState = usePopupState({
    popupId: "open-menu",
    variant: "popover",
  });

  const photoCategoryMenuState = usePopupState({
    popupId: "photo-category-menu",
    variant: "popover",
  });

  const saveMenuState = usePopupState({
    popupId: "save-menu",
    variant: "popover",
  });

  /*
   * Image dialog
   */
  const [openImageDialog, setOpenImageDialog] = React.useState(false);

  const [openedImage, setOpenedImage] = React.useState<Image>(images[0]);

  const onOpenImageDialog = (photo: Image) => {
    setOpenedImage(photo);
    setOpenImageDialog(true);
  };

  const onCloseImageDialog = () => {
    setOpenImageDialog(false);
  };

  /*
   * Settings dialog
   */
  const [openSettingsDialog, setOpenSettingsDialog] = React.useState(false);

  const onOpenSettingsDialog = () => {
    setOpenSettingsDialog(true);
  };

  const onCloseSettingsDialog = () => {
    setOpenSettingsDialog(false);
  };

  const classes = useStyles();

  const theme = useTheme();

  const NewClassifierDialog = () => {
    return (
      <Dialog
        fullWidth
        onClose={onCloseNewClassifierDialog}
        open={openNewClassifierDialog}
      >
        <DialogTitle>New classifier</DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            id="name"
            label="Name"
            margin="dense"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={onCloseNewClassifierDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={onCloseNewClassifierDialog} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const OpenMenu = () => {
    return (
      <Menu
        anchorOrigin={{
          horizontal: "center",
          vertical: "bottom",
        }}
        getContentAnchorEl={null}
        transformOrigin={{
          horizontal: "center",
          vertical: "top",
        }}
        {...bindMenu(openMenuState)}
      >
        <MenuList dense variant="menu">
          <MenuItem onClick={openMenuState.close}>Open classifier</MenuItem>

          <Divider />

          <MenuItem onClick={openMenuState.close}>
            Open example classifier
          </MenuItem>

          <MenuItem onClick={openMenuState.close}>Open weights</MenuItem>
        </MenuList>
      </Menu>
    );
  };

  const PhotoCategoryMenu = () => {
    return (
      <Menu
        anchorOrigin={{
          horizontal: "center",
          vertical: "bottom",
        }}
        getContentAnchorEl={null}
        transformOrigin={{
          horizontal: "center",
          vertical: "top",
        }}
        {...bindMenu(photoCategoryMenuState)}
      >
        <MenuList dense variant="menu">
          {categories.map((category: Category) => (
            <MenuItem key={category.id} onClick={photoCategoryMenuState.close}>
              {category.name}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    );
  };

  const SaveMenu = () => {
    return (
      <Menu
        anchorOrigin={{
          horizontal: "center",
          vertical: "bottom",
        }}
        getContentAnchorEl={null}
        transformOrigin={{
          horizontal: "center",
          vertical: "top",
        }}
        {...bindMenu(saveMenuState)}
      >
        <MenuList dense variant="menu">
          <MenuItem onClick={saveMenuState.close}>Save classifier</MenuItem>

          <Divider />

          <MenuItem onClick={saveMenuState.close}>
            Open example classifier
          </MenuItem>

          <MenuItem onClick={saveMenuState.close}>Open weights</MenuItem>
        </MenuList>
      </Menu>
    );
  };

  const SettingsDialog = () => {
    return (
      <Dialog
        fullScreen
        onClose={onCloseSettingsDialog}
        open={openSettingsDialog}
        TransitionComponent={DialogTransition}
      >
        <AppBar className={classes.settingsDialogAppBar}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onCloseSettingsDialog}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </Dialog>
    );
  };

  return (
    <React.Fragment>
      <CssBaseline />

      <AppBar
        className={clsx(classes.appBar, { [classes.appBarShift]: openDrawer })}
        position="fixed"
      >
        <Toolbar>
          <IconButton color="inherit" onClick={onOpenDrawer} edge="start">
            <MenuIcon />
          </IconButton>

          <Typography color="inherit" noWrap variant="h6">
            Piximi
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        className={classes.drawer}
        classes={{ paper: classes.drawerPaper }}
        open={openDrawer}
        variant="persistent"
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={onCloseDrawer}>
            {theme.direction === "ltr" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </div>

        <Divider />

        <List dense>
          <ListItem button onClick={onOpenNewClassifierDialog}>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>

            <ListItemText primary="New classifier…" />
          </ListItem>

          <ListItem button {...bindTrigger(openMenuState)}>
            <ListItemIcon>
              <FolderOpenIcon />
            </ListItemIcon>

            <ListItemText primary="Open" />
          </ListItem>

          <ListItem button {...bindTrigger(saveMenuState)}>
            <ListItemIcon>
              <SaveIcon />
            </ListItemIcon>

            <ListItemText primary="Save" />
          </ListItem>
        </List>

        <Divider />

        <CategoriesList />

        <Divider />

        <CollapsibleList primary="Classifier">
          <ListItem button disabled>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>

            <ListItemText primary="Fit" />
          </ListItem>

          <ListItem button disabled>
            <ListItemIcon>
              <FolderOpenIcon />
            </ListItemIcon>

            <ListItemText primary="Evaluate" />
          </ListItem>

          <ListItem button disabled>
            <ListItemIcon>
              <SaveIcon />
            </ListItemIcon>

            <ListItemText primary="Predict" />
          </ListItem>
        </CollapsibleList>

        <Divider />

        <List dense>
          <ListItem button onClick={onOpenSettingsDialog}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>

            <ListItemText primary="Settings" />
          </ListItem>

          <ListItem button disabled>
            <ListItemIcon>
              <FeedbackIcon />
            </ListItemIcon>

            <ListItemText primary="Send feedback" />
          </ListItem>

          <ListItem button disabled>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>

            <ListItemText primary="Help" />
          </ListItem>
        </List>
      </Drawer>

      <main className={clsx(classes.main, { [classes.mainShift]: openDrawer })}>
        <Container className={classes.container} maxWidth="md">
          <GridList className={classes.gridList} cols={4}>
            {images.map((photo: Image) => (
              <GridListTile
                key={photo.id}
                onClick={() => onOpenImageDialog(photo)}
              >
                <img alt="" src={photo.src} />

                <GridListTileBar
                  actionIcon={
                    <IconButton
                      className={classes.gridTileBarIconButton}
                      disableRipple
                      {...bindTrigger(photoCategoryMenuState)}
                    >
                      <LabelOutlinedIcon />
                    </IconButton>
                  }
                  actionPosition="left"
                  className={classes.gridTileBar}
                  titlePosition="top"
                />
              </GridListTile>
            ))}
          </GridList>
        </Container>
      </main>

      <ImageDialog
        onClose={onCloseImageDialog}
        open={openImageDialog}
        photo={openedImage}
        TransitionComponent={DialogTransition}
      />
      <NewClassifierDialog />
      <OpenMenu />
      <PhotoCategoryMenu />
      <SaveMenu />
      <SettingsDialog />
    </React.Fragment>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Application />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

serviceWorker.register();
