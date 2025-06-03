import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Box, Divider, Badge } from "@mui/material";
import {
  Delete as DeleteIcon,
  Deselect as DeselectIcon,
  SelectAll as SelectAllIcon,
} from "@mui/icons-material";

import { useDialogHotkey, useHotkeys, useMobileView } from "hooks";
import { useThingSelection } from "../../hooks";

import { LogoLoader, AlertBar } from "components/ui";
import { TooltipTitle, TooltipButton } from "components/ui/tooltips";
import { CustomAppBar } from "components/layout";
import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";
import { ZoomControl } from "./ZoomControl";
import { ProjectTextField } from "./ProjextTextField";
import { CategorizeChip } from "./CategorizeChip";

import { dataSlice } from "store/data";
import { selectActiveKindId } from "store/project/selectors";
import {
  selectAlertState,
  selectLoadPercent,
} from "store/applicationSettings/selectors";

import { pluralize } from "utils/stringUtils";
import { HotkeyContext } from "utils/enums";
import { ImageViewerButton } from "./ImageViewerButton";
import { MeasurementsButton } from "./MeasurementsButton";

export const ProjectAppBar = () => {
  const dispatch = useDispatch();
  const activeKind = useSelector(selectActiveKindId);
  const loadPercent = useSelector(selectLoadPercent);
  const alertState = useSelector(selectAlertState);
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
    <>
      <Box>
        <CustomAppBar toolbarProps={{ sx: { height: 44, minHeight: 44 } }}>
          <LogoLoader width={250} height={50} loadPercent={loadPercent} />

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
        </CustomAppBar>
      </Box>
      {alertState.visible && <AlertBar alertState={alertState} />}
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
    </>
  );
};
