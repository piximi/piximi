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

import { unregisterHotkeyView } from "store/slices/applicationSettings";

import { HotkeyView } from "types";
import { projectSlice } from "store/slices/project";
import { selectCategoriesInView } from "store/slices/newData/selectors/selectors";

type GridItemActionBarProps = {
  showAppBar: boolean;
  allSelected: boolean;
  selectedThings: any;
  selectAllThings: any;
  deselectAllThings: any;
  handleOpenDeleteDialog: any;
  onUpdateCategories: (categoryId: string) => void;
  onOpenImageViewer: any;
};

export const GridItemActionBarNew = ({
  showAppBar,
  allSelected,
  selectedThings,
  selectAllThings,
  deselectAllThings,
  onUpdateCategories: handleUpdateCategories,
  handleOpenDeleteDialog,
  onOpenImageViewer: handleOpenImageViewer,
}: GridItemActionBarProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const categories = useSelector(selectCategoriesInView);

  const handleSelectAllObjects = () => {
    selectAllThings();
  };

  const handleDeselectAllObjects = () => {
    deselectAllThings();
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
      dispatch(projectSlice.actions.setSelectedImages({ ids: [] }));
      dispatch(projectSlice.actions.setSelectedAnnotations({ ids: [] }));
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
              {`${selectedThings.length} selected `}
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

            {!allSelected ? (
              <Tooltip
                placement="bottom"
                title={TooltipTitle(`Select all`, "control", "a")}
              >
                <IconButton color="inherit" onClick={handleSelectAllObjects}>
                  <SelectAllIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip
                placement="bottom"
                title={TooltipTitle(`Unselect`, "esc")}
              >
                <IconButton color="inherit" onClick={handleDeselectAllObjects}>
                  <DeselectIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip
              placement="bottom"
              title={TooltipTitle(`Delete selected`, "delete")}
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
        selectedIds={selectedThings}
        onClose={onCloseCategoryMenu}
        open={Boolean(categoryMenuAnchorEl as HTMLElement)}
        onUpdateCategories={handleUpdateCategories}
        categories={categories}
      />
    </>
  );
};
