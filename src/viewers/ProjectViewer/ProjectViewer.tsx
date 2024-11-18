import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";

import { Box } from "@mui/material";

import {
  useErrorHandler,
  useMenu,
  useMobileView,
  useUnloadConfirmation,
} from "hooks";

import { applicationSettingsSlice } from "store/applicationSettings";
import { projectSlice } from "store/project";

import { ProjectDrawer, ImageToolDrawer } from "sections/drawers";
import { FallBackDialog } from "sections/dialogs";
import { dimensions } from "utils/common/constants";
import { ImageGrid } from "sections/image-grids";
import { ProjectAppBar } from "sections/app-bars";
import { HotkeyContext } from "utils/common/enums";
import { dataSlice } from "store/data/dataSlice";
import { selectVisibleKinds } from "store/project/reselectors";
import {
  selectActiveKindId,
  selectKindTabFilters,
} from "store/project/selectors";
import { selectKindDictionary } from "store/data/selectors";
import { CustomTabs } from "components/CustomTabSwitcher";
import { AddKindMenu } from "sections/AddKindMenu";

export const ProjectViewer = () => {
  const dispatch = useDispatch();
  const activeKind = useSelector(selectActiveKindId);
  const kinds = useSelector(selectKindDictionary);
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
    (item: string, newItem?: string) => {
      if (newItem) {
        dispatch(projectSlice.actions.setActiveKind({ kind: newItem }));
      }

      dispatch(
        dataSlice.actions.deleteKind({
          deletedKindId: item,
          isPermanent: true,
        })
      );
    },
    [dispatch]
  );
  const handleTabMinimize = useCallback(
    (item: string, newItem?: string) => {
      if (newItem) {
        dispatch(projectSlice.actions.setActiveKind({ kind: newItem }));
      }

      dispatch(projectSlice.actions.addKindTabFilter({ kindId: item }));
    },
    [dispatch]
  );

  const handleTabChange = (tab: string) => {
    dispatch(projectSlice.actions.setActiveKind({ kind: tab }));
    dispatch(
      projectSlice.actions.updateHighlightedCategory({
        categoryId: kinds[tab].unknownCategoryId,
      })
    );
  };

  useEffect(() => {
    dispatch(
      applicationSettingsSlice.actions.registerHotkeyContext({
        context: HotkeyContext.ProjectView,
      })
    );
    return () => {
      dispatch(
        applicationSettingsSlice.actions.unregisterHotkeyContext({
          context: HotkeyContext.ProjectView,
        })
      );
    };
  }, [dispatch]);

  useEffect(() => {
    if (isMobile) {
      const minimizeOnResize = visibleKinds.filter(
        (kind) => kind !== activeKind
      );
      minimizeOnResize.forEach((kind) => handleTabMinimize(kind));
    }
  }, [isMobile, activeKind, handleTabMinimize, visibleKinds]);

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
              <CustomTabs
                extendable
                transition="sliding"
                childClassName="grid-tabs"
                labels={visibleKinds}
                secondaryEffect={handleTabChange}
                handleTabClose={handleTabClose}
                handleNew={handleOpenAddKindMenu}
                handleTabMin={handleTabMinimize}
              >
                {visibleKinds.map((kind) => (
                  <ImageGrid key={`${kind}-imageGrid`} kind={kind} />
                ))}
              </CustomTabs>
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
