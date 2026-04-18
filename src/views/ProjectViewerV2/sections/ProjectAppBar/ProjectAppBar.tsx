import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Box, Divider, Badge, Stack } from "@mui/material";
import {
  Delete as DeleteIcon,
  Deselect as DeselectIcon,
  SelectAll as SelectAllIcon,
} from "@mui/icons-material";

import { useDialogHotkey, useHotkeys, useMobileView } from "hooks";
import { useThingSelection } from "../../hooks";

import { LogoLoader } from "components/ui";
import { TooltipTitle, TooltipButton } from "components/ui/tooltips";
import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";
import { ZoomControl } from "./ZoomControl";
import { ProjectTextField } from "./ProjextTextField";
import { CategorizeChip } from "./CategorizeChip";

import { dataSlice } from "store/data";
import { selectActiveKindId } from "store/project/selectors";
import { selectLoadPercent } from "store/applicationSettings/selectors";

import { pluralize } from "utils/stringUtils";
import { HotkeyContext } from "utils/enums";
import { ImageViewerButton } from "./ImageViewerButton";
import { MeasurementsButton } from "./MeasurementsButton";
import { DIMENSIONS } from "utils/constants";

export const ProjectAppBar = () => {
  const dispatch = useDispatch();
  const activeKind = useSelector(selectActiveKindId);
  const loadPercent = useSelector(selectLoadPercent);
  const isMobile = useMobileView();

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
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleDelete = () => {
    dispatch(
      dataSlice.actions.deleteThings({
        thingIds: unfilteredSelectedThings,
        disposeColorTensors: true,
      }),
    );
  };

  useHotkeys(
    "esc",
    () => {
      unfilteredSelectedThings.length > 0 && handleDeselectAll();
    },
    HotkeyContext.ProjectView,
    [handleDeselectAll, unfilteredSelectedThings],
  );
  useHotkeys(
    "delete, backspace",
    () => {
      unfilteredSelectedThings.length > 0 && onOpenDeleteImagesDialog();
    },
    HotkeyContext.ProjectView,
    [unfilteredSelectedThings],
  );
  useHotkeys(
    "control+a",
    () => !allSelected && handleSelectAll(),
    HotkeyContext.ProjectView,
    [handleSelectAll],
  );

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        position: "relative",
        gridArea: "top-tools",
        height: DIMENSIONS.toolDrawerWidth,
        overflowY: "visible",
        zIndex: 1002,
        px: 1,
      })}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          width: isMobile ? undefined : DIMENSIONS.leftDrawerWidth - 8,
        }}
      >
        <LogoLoader
          width={175}
          height={DIMENSIONS.toolDrawerWidth - 8}
          loadPercent={loadPercent}
        />
      </Box>

      <ProjectTextField />

      <Box sx={{ flexGrow: 1 }} />

      {isMobile ? (
        <ZoomControl />
      ) : (
        <>
          <ZoomControl />

          <TooltipButton
            tooltipTitle={TooltipTitle(`Select all`, "control", "a")}
            color="inherit"
            onClick={handleSelectAll}
            disabled={allSelected}
            icon={true}
            data-testid="select-all-button"
          >
            <Badge
              data-testid="select-all-badge"
              badgeContent={unfilteredSelectedThings.length}
              color="primary"
              sx={(theme) => ({
                "& .MuiBadge-badge": {
                  top: 8,
                  right: -1,
                  border: `2px solid ${theme.palette.background.paper}`,
                  padding: "0 4px",
                },
              })}
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
          <CategorizeChip unfilteredSelectedThings={unfilteredSelectedThings} />
          <Divider
            variant="middle"
            orientation="vertical"
            flexItem
            sx={{ mr: 2 }}
          />
          <ImageViewerButton selectedThings={allSelectedThingIds} />
          <MeasurementsButton />
        </>
      )}

      <ConfirmationDialog
        title={`Delete ${pluralize(
          "Object",
          unfilteredSelectedThings.length,
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
    </Stack>
  );
};
