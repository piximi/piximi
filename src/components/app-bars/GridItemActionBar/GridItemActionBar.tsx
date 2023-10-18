import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  AppBar,
  Chip,
  IconButton,
  Slide,
  Toolbar,
  Tooltip,
  Typography,
  Box,
} from "@mui/material";

import {
  Clear as ClearIcon,
  Delete as DeleteIcon,
  Deselect as DeselectIcon,
  Gesture as GestureIcon,
  LabelOutlined as LabelOutlinedIcon,
  SelectAll as SelectAllIcon,
} from "@mui/icons-material";

import { ImageCategoryMenu } from "../../menus/ImageCategoryMenu";
import { TooltipTitle } from "components/tooltips";

import { unregisterHotkeyView } from "store/application";

import { HotkeyView, ImageGridTab } from "types";
import {
  selectAllAnnotationCategories,
  selectAllImageCategories,
} from "store/data";
import { projectSlice } from "store/project";

type GridItemActionBarProps = {
  currentTab: ImageGridTab;
  showAppBar: boolean;
  selectedObjects: any;
  selectAllObjects: any;
  deselectAllObjects: any;
  handleDeleteObjects: any;
  handleOpenDeleteDialog: any;
  onUpdateCategories: (categoryId: string) => void;
  onOpenImageViewer: any;
};

export const GridItemActionBar = ({
  currentTab,
  showAppBar,
  selectedObjects,
  selectAllObjects,
  deselectAllObjects,
  handleDeleteObjects,
  onUpdateCategories: handleUpdateCategories,
  handleOpenDeleteDialog,
  onOpenImageViewer: handleOpenImageViewer,
}: GridItemActionBarProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const [showSelectAllButton, setShowSelectAllButton] =
    React.useState<boolean>(true);

  const imageCategories = useSelector(selectAllImageCategories);
  const annotationCategories = useSelector(selectAllAnnotationCategories);

  const handleSelectAllObjects = () => {
    setShowSelectAllButton(false);
    selectAllObjects();
  };

  const handleDeselectAllObjects = () => {
    setShowSelectAllButton(true);
    deselectAllObjects();
  };

  const onOpenCategoriesMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };

  const handleNavigateImageViewer = () => {
    handleOpenImageViewer();
    dispatch(
      unregisterHotkeyView({ hotkeyView: HotkeyView.MainImageGridAppBar })
    );
    batch(() => {
      dispatch(projectSlice.actions.clearSelectedImages());
      dispatch(projectSlice.actions.clearSelectedAnnotations());
    });
    navigate("/annotator");
  };

  return (
    <>
      <Slide appear={false} direction="down" in={showAppBar}>
        <AppBar color="inherit" position="fixed">
          <Toolbar>
            <Tooltip
              placement="bottom"
              title={TooltipTitle("Unselect images", "esc")}
            >
              <IconButton
                sx={{ marginRight: (theme) => theme.spacing(2) }}
                edge="start"
                color="inherit"
                onClick={handleDeselectAllObjects}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>

            <Typography sx={{ flexGrow: 1 }}>
              {`${selectedObjects.length} selected ${currentTab.slice(
                0,
                currentTab.length - 1
              )}${selectedObjects.length === 1 ? "" : "s"}`}
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <Chip
              avatar={<LabelOutlinedIcon color="inherit" />}
              label="Categorize"
              onClick={onOpenCategoriesMenu}
              variant="outlined"
              style={{ marginRight: 15 }}
            />
            <Chip
              avatar={<GestureIcon color="inherit" />}
              label="Annotate"
              onClick={handleNavigateImageViewer}
              variant="outlined"
            />

            {showSelectAllButton ? (
              <Tooltip
                placement="bottom"
                title={TooltipTitle(
                  `Select all ${currentTab}s`,
                  "control",
                  "a"
                )}
              >
                <IconButton color="inherit" onClick={handleSelectAllObjects}>
                  <SelectAllIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip
                placement="bottom"
                title={TooltipTitle(`Unselect ${currentTab}s`, "esc")}
              >
                <IconButton color="inherit" onClick={handleDeselectAllObjects}>
                  <DeselectIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip
              placement="bottom"
              title={TooltipTitle(`Delete selected ${currentTab}s`, "delete")}
            >
              <IconButton color="inherit" onClick={handleOpenDeleteDialog}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
      </Slide>

      <ImageCategoryMenu
        anchorEl={categoryMenuAnchorEl as HTMLElement}
        selectedIds={selectedObjects}
        onClose={onCloseCategoryMenu}
        open={Boolean(categoryMenuAnchorEl as HTMLElement)}
        onUpdateCategories={handleUpdateCategories}
        categories={
          currentTab === "Images" ? imageCategories : annotationCategories
        }
      />
    </>
  );
};
