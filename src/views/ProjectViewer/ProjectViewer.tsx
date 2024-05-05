import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";

import { Box, CssBaseline } from "@mui/material";

import {
  useErrorHandler,
  useMenu,
  useMobileView,
  useUnloadConfirmation,
} from "hooks";

import { applicationSettingsSlice } from "store/applicationSettings";
import { projectSlice } from "store/project";

import { ProjectDrawer, ImageToolDrawer } from "components/drawers";
import { FallBackDialog } from "components/dialogs";
import { dimensions } from "utils/common/constants";
import { InteractiveTabbedView } from "components/styled-components";
import { ImageGrid } from "components/image-grids";
import { ProjectAppBar } from "components/app-bars/";
import { HotkeyView } from "utils/common/enums";
import { dataSlice } from "store/data/dataSlice";
import { selectVisibleKinds } from "store/project/reselectors";
import {
  selectActiveKindId,
  selectKindTabFilters,
} from "store/project/selectors";
import { AddKindMenu } from "components/menus";

export const ProjectViewer = () => {
  const dispatch = useDispatch();
  const activeKind = useSelector(selectActiveKindId);
  const visibleKinds = useSelector(selectVisibleKinds) as string[];
  const filteredKinds = useSelector(selectKindTabFilters) as string[];
  const isMobile = useMobileView();

  const {
    onOpen: handleOpenAddKindMenu,
    onClose: handleCloseAddKindMenu,
    open: isAddKindMenuOpen,
    anchorEl: addKindMenuAnchor,
  } = useMenu();

  useErrorHandler();
  useUnloadConfirmation();

  const handleTabClose = useCallback(
    (action: "delete" | "hide", item: string, newItem?: string) => {
      if (newItem) {
        dispatch(projectSlice.actions.setActiveKind({ kind: newItem }));
      }
      if (action === "delete") {
        dispatch(
          dataSlice.actions.deleteKind({
            deletedKindId: item,
            isPermanent: true,
          })
        );
      } else {
        dispatch(projectSlice.actions.addKindTabFilter({ kindId: item }));
      }
    },
    [dispatch]
  );

  const handleTabChange = (tab: string) => {
    dispatch(projectSlice.actions.setActiveKind({ kind: tab }));
  };

  useEffect(() => {
    dispatch(
      applicationSettingsSlice.actions.registerHotkeyView({
        hotkeyView: HotkeyView.ProjectView,
      })
    );
    return () => {
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyView({
          hotkeyView: HotkeyView.ProjectView,
        })
      );
    };
  }, [dispatch]);
  useEffect(() => {
    if (isMobile) {
      const minimizeOnResize = visibleKinds.filter(
        (kind) => kind !== activeKind
      );
      minimizeOnResize.forEach((kind) => handleTabClose("hide", kind));
    }
  }, [isMobile, activeKind, handleTabClose, visibleKinds]);

  useEffect(() => {
    if (!isMobile) {
      dispatch(projectSlice.actions.removeAllKindTabFilters());
    }
  }, [isMobile, dispatch]);

  return (
    <div>
      <ErrorBoundary FallbackComponent={FallBackDialog}>
        <div tabIndex={-1}>
          <Box sx={{ height: "100vh" }}>
            <CssBaseline />
            <ProjectAppBar />

            <ProjectDrawer />

            <Box
              sx={(theme) => ({
                maxWidth: `calc(100%  ${
                  isMobile ? "" : "- " + dimensions.leftDrawerWidth + "px"
                } - ${dimensions.toolDrawerWidth}px)`, // magic number draw width
                overflow: "hidden",
                flexGrow: 1,
                height: "100%",
                paddingTop: theme.spacing(8),
                marginLeft: isMobile ? 0 : theme.spacing(32),
              })}
            >
              <InteractiveTabbedView
                childClassName="grid-tabs"
                labels={visibleKinds}
                secondaryEffect={handleTabChange}
                onTabClose={handleTabClose}
                onNew={handleOpenAddKindMenu}
              >
                {visibleKinds.map((kind) => (
                  <ImageGrid key={`${kind}-imageGrid`} kind={kind} />
                ))}
              </InteractiveTabbedView>
            </Box>
            <ImageToolDrawer />
          </Box>
        </div>

        <AddKindMenu
          anchor={addKindMenuAnchor}
          isOpen={isAddKindMenuOpen}
          onClose={handleCloseAddKindMenu}
          filteredKinds={filteredKinds}
        />
      </ErrorBoundary>
    </div>
  );
};
