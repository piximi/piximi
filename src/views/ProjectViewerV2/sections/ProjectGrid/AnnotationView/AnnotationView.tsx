import React, { useCallback, useEffect, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Add as AddIcon } from "@mui/icons-material";
import { Box, Divider, IconButton } from "@mui/material";

import { useMenu, useMobileView } from "hooks";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

import { projectSlice } from "@ProjectViewer/state/projectSlice";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import { selectAnnotationGridState } from "@ProjectViewer/state/selectors";

import { DIMENSIONS } from "utils/constants";
import { findAdjacentItem } from "utils/arrayUtils";

import { AddKindMenu } from "../AddKindMenu";
import { KindTab } from "./KindTab";
import { AnnotationGrid } from "./AnnotationGrid";

export const AnnotationView = () => {
  const dispatch = useDispatch();
  const gridState = useSelector(selectAnnotationGridState);

  const visibleKinds = useMemo(
    () =>
      Object.values(gridState.kindStates).filter(
        (state) => state.visible === true,
      ),
    [gridState.kindStates],
  );
  const minimizedKindIds = useMemo(
    () =>
      Object.values(gridState.kindStates)
        .filter((state) => state.visible === false)
        .map((state) => state.id),
    [gridState.kindStates],
  );
  const isMobile = useMobileView();

  const {
    onOpen: handleOpenAddKindMenu,
    onClose: handleCloseAddKindMenu,
    open: isAddKindMenuOpen,
    anchorEl: addKindMenuAnchor,
  } = useMenu();

  const handleTabDelete = useCallback(
    (id: string) => {
      dispatch(dataSliceV2.actions.deleteKind(id));
    },
    [dispatch],
  );

  const handleTabMinimize = useCallback(
    (id: string) => {
      if (id === gridState.activeKindId) {
        const adjacent = findAdjacentItem(
          visibleKinds.map((kind) => kind.id),
          id,
        );
        dispatch(projectSlice.actions.setActiveKind(adjacent));
      }
      dispatch(
        projectSlice.actions.setKindTabVisibility({
          kindId: id,
          visible: false,
        }),
      );
    },
    [dispatch],
  );

  const handleTabChange = (id: string) => {
    dispatch(projectSlice.actions.setActiveKind(id));
    return;
  };

  const handleKindEdit = (kindId: string, newDisplayName: string) => {
    dispatch(
      dataSliceV2.actions.updateKindName({ kindId, name: newDisplayName }),
    );
  };

  useEffect(() => {
    if (isMobile) {
      const minimizeOnResize = visibleKinds.filter(
        (kind) => kind.id !== gridState.activeKindId,
      );
      minimizeOnResize.forEach((kind) => handleTabMinimize(kind.id));
    }
  }, [isMobile, gridState.activeKindId, handleTabMinimize, visibleKinds]);

  useEffect(() => {
    if (!isMobile) {
      dispatch(projectSlice.actions.removeAllKindTabFilters());
    }
  }, [isMobile, dispatch]);

  return (
    <Box
      sx={{
        width: "100%",
        flexGrow: 1,
        display: "flex",
        overflowY: "hidden",
        flexDirection: "column",
      }}
    >
      <Box
        sx={(theme) => ({
          width: "100%",
          display: "flex",
          justifyContent: "center",
          height: DIMENSIONS.toolDrawerWidth,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Box sx={{ flex: 1, display: "flex" }}>
          {visibleKinds.map((state) => (
            <KindTab
              key={`kind-tab-${state.id}`}
              kind={state}
              handleDelete={handleTabDelete}
              handleMinimize={handleTabMinimize}
              handleSelect={handleTabChange}
              handleTabEdit={handleKindEdit}
              active={state.id === gridState.activeKindId}
            />
          ))}
        </Box>
        <Divider orientation="vertical" />
        <Box display="flex" flexShrink={1} justifySelf="flex-end">
          <IconButton
            data-help={HelpItem.AddKindTab}
            onClick={handleOpenAddKindMenu}
            disableRipple
          >
            <AddIcon />
          </IconButton>
        </Box>
      </Box>

      {visibleKinds.map((kind) => (
        <Box
          key={`annotation-grid-${kind.name}`}
          sx={{
            width: "100%",
            flexGrow: 1,
            display: gridState.activeKindId === kind.id ? "block" : "none",
          }}
        >
          <AnnotationGrid kindState={kind} />
        </Box>
      ))}

      <AddKindMenu
        anchor={addKindMenuAnchor}
        isOpen={isAddKindMenuOpen}
        onClose={handleCloseAddKindMenu}
        filteredKinds={minimizedKindIds}
      />
    </Box>
  );
};
