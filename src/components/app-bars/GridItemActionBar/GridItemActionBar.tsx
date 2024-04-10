import React from "react";
import { useDispatch, useSelector } from "react-redux";
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

import { ImageCategoryMenu } from "components/menus";
import { TooltipTitle } from "components/tooltips";

import { applicationSettingsSlice } from "store/applicationSettings";

import { HotkeyView } from "utils/common/enums";
import { dataSlice } from "store/data/dataSlice";
import { Partition } from "utils/models/enums";
import { selectActiveCategories } from "store/project/reselectors";

type GridItemActionBarProps = {
  allSelected: boolean;
  selectedThings: string[];
  selectAllThings: any;
  deselectAllThings: any;
  handleOpenDeleteDialog: any;
  onOpenImageViewer: any;
};

export const GridItemActionBar = ({
  allSelected,
  selectedThings,
  selectAllThings,
  deselectAllThings,
  handleOpenDeleteDialog,
  onOpenImageViewer: handleOpenImageViewer,
}: GridItemActionBarProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);

  const categories = useSelector(selectActiveCategories);

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
  const handleUpdateCategories = (categoryId: string) => {
    const updates = selectedThings.map((thingId) => ({
      id: thingId,
      categoryId: categoryId,
      partition: Partition.Unassigned,
    }));
    dispatch(
      dataSlice.actions.updateThings({
        updates,
        isPermanent: true,
      })
    );
  };

  const handleNavigateImageViewer = () => {
    handleOpenImageViewer();
    dispatch(
      applicationSettingsSlice.actions.unregisterHotkeyView({
        hotkeyView: HotkeyView.MainImageGridAppBar,
      })
    );
    navigate("/imageviewer");
  };

  return (
    <>
      <Slide appear={false} direction="down" in={selectedThings.length > 0}>
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
