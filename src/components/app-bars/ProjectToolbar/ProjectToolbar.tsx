import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Slider,
  Toolbar,
  Box,
  Typography,
  TextField,
  FormControl,
  Menu,
  Tooltip,
  IconButton,
  Chip,
  Divider,
  Badge,
} from "@mui/material";
import {
  ZoomIn as ZoomInIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Deselect as DeselectIcon,
  Gesture as GestureIcon,
  LabelOutlined as LabelOutlinedIcon,
  SelectAll as SelectAllIcon,
  Straighten as StraightenIcon,
} from "@mui/icons-material";

import { LogoLoader } from "components/styled-components";

import { applicationSettingsSlice } from "store/applicationSettings";
import { projectSlice } from "store/project";
import { SortSelection } from "components/styled-components";
import {
  selectActiveKindId,
  selectLoadMessage,
  selectLoadPercent,
  selectProjectName,
} from "store/project/selectors";
import {
  useDialogHotkey,
  useMenu,
  useMobileView,
  useThingSelection,
} from "hooks";
import { TooltipTitle } from "components/tooltips";
import { HotkeyView } from "utils/common/enums";
import { useNavigate } from "react-router-dom";
import { selectActiveCategories } from "store/project/reselectors";
import { imageViewerSlice } from "store/imageViewer";
import { TooltipButton } from "components/styled-components/TooltipButton/TooltipButton";
import { DialogWithAction } from "components/dialogs";
import { ImageCategoryMenu } from "components/menus";
import { Partition } from "utils/models/enums";
import { dataSlice } from "store/data";
import { pluralize } from "utils/common/helpers";

const minZoom = 0.6;
const maxZoom = 4;

export const ProjectToolbar = () => {
  const dispatch = useDispatch();
  const activeKind = useSelector(selectActiveKindId);
  const loadPercent = useSelector(selectLoadPercent);
  const isMobile = useMobileView();
  const navigate = useNavigate();

  const {
    allSelected,
    unfilteredSelectedThings,
    allSelectedThingIds,
    handleDeselectAll,
    handleSelectAll,
  } = useThingSelection();

  const {
    onClose: handleCloseDeleteImagesDialog,
    onOpen: onOpenDeleteImagesDialog,
    open: deleteImagesDialogisOpen,
  } = useDialogHotkey(HotkeyView.DialogWithAction);

  const handleDelete = () => {
    dispatch(
      dataSlice.actions.deleteThings({
        thingIds: unfilteredSelectedThings,
        disposeColorTensors: true,
        isPermanent: true,
      })
    );
  };

  const handleNavigateImageViewer = () => {
    dispatch(
      imageViewerSlice.actions.prepareImageViewer({
        selectedThingIds: allSelectedThingIds,
      })
    );
    dispatch(
      applicationSettingsSlice.actions.unregisterHotkeyView({
        hotkeyView: HotkeyView.MainImageGridAppBar,
      })
    );
    navigate("/imageviewer");
  };

  const handleNavigateMeasurements = () => {
    dispatch(
      applicationSettingsSlice.actions.unregisterHotkeyView({
        hotkeyView: HotkeyView.MainImageGridAppBar,
      })
    );
    navigate("/measurements");
  };

  return (
    <>
      <Toolbar>
        <LogoLoader width={250} height={50} loadPercent={loadPercent} />

        <ProjectTextField />

        <Box sx={{ flexGrow: 1 }} />

        {isMobile ? (
          <ZoomControl />
        ) : (
          <>
            <SortSelection />
            <Divider
              variant="middle"
              orientation="vertical"
              flexItem
              sx={{ ml: 2 }}
            />
            <ZoomControl />

            <TooltipButton
              tooltipTitle={TooltipTitle(`Select all`, "control", "a")}
              color="inherit"
              onClick={handleSelectAll}
              disabled={allSelected}
              icon={true}
            >
              <Badge
                badgeContent={unfilteredSelectedThings.length}
                color="primary"
              >
                <SelectAllIcon />
              </Badge>
            </TooltipButton>

            <TooltipButton
              tooltipTitle={TooltipTitle(`Deselect`, "esc")}
              color="inherit"
              onClick={handleDeselectAll}
              disabled={unfilteredSelectedThings.length === 0}
              icon={true}
            >
              <DeselectIcon />
            </TooltipButton>

            <TooltipButton
              tooltipTitle={TooltipTitle(`Delete selected`, "delete")}
              color="inherit"
              disabled={unfilteredSelectedThings.length === 0}
              onClick={onOpenDeleteImagesDialog}
              icon={true}
            >
              <DeleteIcon />
            </TooltipButton>

            <Divider
              variant="middle"
              orientation="vertical"
              flexItem
              sx={{ mr: 2 }}
            />
            <CategorizeChip
              unfilteredSelectedThings={unfilteredSelectedThings}
            />
            <Tooltip
              title={
                allSelectedThingIds.length === 0
                  ? "Select Objects to Annotate"
                  : "Annotate Selection"
              }
            >
              <span>
                <Chip
                  avatar={<GestureIcon color="inherit" />}
                  label="Annotate"
                  onClick={handleNavigateImageViewer}
                  variant="outlined"
                  sx={{ marginRight: 1 }}
                  disabled={allSelectedThingIds.length === 0}
                />
              </span>
            </Tooltip>
            <Tooltip title="Go to Measurements">
              <span>
                <Chip
                  avatar={<StraightenIcon color="inherit" />}
                  label="Measurements"
                  onClick={handleNavigateMeasurements}
                  variant="outlined"
                />
              </span>
            </Tooltip>
          </>
        )}
      </Toolbar>

      <DialogWithAction
        title={`Delete ${pluralize(
          "Object",
          unfilteredSelectedThings.length
        )}?`}
        content={`Objects will be deleted from the project. ${
          activeKind === "Image"
            ? "Associated annotations will also be removed."
            : ""
        } `}
        onConfirm={handleDelete}
        isOpen={deleteImagesDialogisOpen}
        onClose={handleCloseDeleteImagesDialog}
      />
    </>
  );
};

const ZoomControl = () => {
  const dispatch = useDispatch();
  const [value, setValue] = useState<number>(1);
  const { onOpen, onClose, open, anchorEl } = useMenu();

  const handleSizeChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number);
    dispatch(
      applicationSettingsSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };

  const onZoomOut = () => {
    const newValue = value - 0.1 >= minZoom ? value - 0.1 : minZoom;
    setValue(newValue as number);
    dispatch(
      applicationSettingsSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };

  const onZoomIn = () => {
    const newValue = value + 0.1 <= maxZoom ? value + 0.1 : maxZoom;
    setValue(newValue as number);
    dispatch(
      applicationSettingsSlice.actions.updateTileSize({
        newValue: newValue as number,
      })
    );
  };

  return (
    <>
      <IconButton color="inherit" onClick={onOpen}>
        <ZoomInIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={onClose}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <AddIcon onClick={onZoomIn} />
          <Slider
            orientation="vertical"
            value={value}
            min={minZoom}
            max={maxZoom}
            step={0.1}
            onChange={handleSizeChange}
            sx={{ height: (maxZoom - minZoom) * 20 + "px", my: 1, mr: 0 }}
          />
          <RemoveIcon onClick={onZoomOut} />
        </Box>
      </Menu>
    </>
  );
};

const CategorizeChip = ({
  unfilteredSelectedThings,
}: {
  unfilteredSelectedThings: string[];
}) => {
  const dispatch = useDispatch();
  const categories = useSelector(selectActiveCategories);
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const onOpenCategoriesMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    setCategoryMenuAnchorEl(event.currentTarget);
  };

  const onCloseCategoryMenu = () => {
    setCategoryMenuAnchorEl(null);
  };
  const handleUpdateCategories = (categoryId: string) => {
    const updates = unfilteredSelectedThings.map((thingId) => ({
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
  return (
    <>
      <Tooltip
        title={
          unfilteredSelectedThings.length === 0
            ? "Select Objects to Categorize"
            : "Categorize Selection"
        }
      >
        <span>
          <Chip
            avatar={<LabelOutlinedIcon color="inherit" />}
            label="Categorize"
            onClick={onOpenCategoriesMenu}
            variant="outlined"
            sx={{ marginRight: 1 }}
            disabled={unfilteredSelectedThings.length === 0}
          />
        </span>
      </Tooltip>
      <ImageCategoryMenu
        anchorEl={categoryMenuAnchorEl as HTMLElement}
        selectedIds={unfilteredSelectedThings}
        onClose={onCloseCategoryMenu}
        open={Boolean(categoryMenuAnchorEl as HTMLElement)}
        onUpdateCategories={handleUpdateCategories}
        categories={categories}
      />
    </>
  );
};

const ProjectTextField = () => {
  const dispatch = useDispatch();

  const loadMessage = useSelector(selectLoadMessage);
  const projectName = useSelector(selectProjectName);
  const [newProjectName, setNewProjectName] = useState<string>(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTextFieldBlur = () => {
    if (projectName === newProjectName) return;
    dispatch(projectSlice.actions.setProjectName({ name: newProjectName }));
    setNewProjectName("");
  };

  const handleTextFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNewProjectName(event.target.value);
  };

  const handleTextFieldEnter = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  return (
    <>
      {loadMessage ? (
        <Typography ml={5} sx={{ flexGrow: 1 }}>
          {loadMessage}
        </Typography>
      ) : (
        <FormControl>
          <TextField
            onChange={handleTextFieldChange}
            onBlur={handleTextFieldBlur}
            onKeyDown={handleTextFieldEnter}
            defaultValue={projectName}
            inputRef={inputRef}
            size="small"
            sx={{ ml: 5 }}
          />
        </FormControl>
      )}
    </>
  );
};
