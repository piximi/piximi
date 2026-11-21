import { useCallback, useEffect, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Add as AddIcon } from "@mui/icons-material";
import { Badge, Box, Divider, IconButton } from "@mui/material";

import { UNKNOWN_KIND_ID } from "core/entities";
import { useBackend } from "core/backend";

import { useMenu, useMobileView } from "hooks";

import { selectKindEntities } from "store/data/selectors";
import { HelpItem } from "help/HelpContent";

import { DIMENSIONS } from "utils/constants";
import { findAdjacentItem } from "utils/arrayUtils";

import { useAnnotationCounts } from "@ProjectViewer/hooks";
import { selectAnnotationGridState } from "@ProjectViewer/state/selectors";
import { projectSlice } from "@ProjectViewer/state/projectSlice";

import { AddKindMenu } from "../AddKindMenu";
import { KindTab } from "./KindTab";
import { AnnotationGrid } from "./AnnotationGrid";

const UNKNOWN_KIND_QUERY = { kindIds: [UNKNOWN_KIND_ID] };

export const AnnotationView = () => {
  const dispatch = useDispatch();
  const backend = useBackend();
  const gridState = useSelector(selectAnnotationGridState);
  const kinds = useSelector(selectKindEntities);
  const unknownCount = useAnnotationCounts(UNKNOWN_KIND_QUERY)?.total ?? 0;

  const visibleKinds = useMemo(
    () =>
      Object.values(gridState.kindStates).filter((state) =>
        state.id === UNKNOWN_KIND_ID
          ? state.visible === true && unknownCount > 0
          : state.visible === true,
      ),
    [gridState.kindStates, unknownCount],
  );
  const minimizedKinds = useMemo(
    () =>
      Object.values(gridState.kindStates)
        .filter((state) => state.visible === false)
        .map((state) => kinds[state.id]),
    [kinds, gridState.kindStates],
  );
  const isMobile = useMobileView();

  const {
    onOpen: handleOpenAddKindMenu,
    onClose: handleCloseAddKindMenu,
    open: isAddKindMenuOpen,
    anchorEl: addKindMenuAnchor,
  } = useMenu();

  // Kinds are the backend's: deleting and renaming go through it and the
  // store follows its announcements.
  const handleTabDelete = useCallback(
    (id: string) => {
      backend.kinds
        .delete([id])
        .catch((error: unknown) =>
          console.error("[AnnotationView] delete kind", error),
        );
    },
    [backend],
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
    [dispatch, gridState.activeKindId, visibleKinds],
  );

  const handleTabChange = (id: string) => {
    dispatch(projectSlice.actions.setActiveKind(id));
    return;
  };

  const handleKindEdit = (kindId: string, newDisplayName: string) => {
    backend.kinds
      .update(kindId, newDisplayName)
      .catch((error: unknown) =>
        console.error("[AnnotationView] rename kind", error),
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
      dispatch(projectSlice.actions.setAllKindTabVisibility(true));
    }
  }, [isMobile, dispatch]);

  useEffect(() => {
    if (visibleKinds.length === 0) return;
    if (visibleKinds.some((kind) => kind.id === gridState.activeKindId)) return;

    dispatch(projectSlice.actions.setActiveKind(visibleKinds[0].id));
  }, [visibleKinds, gridState.activeKindId, dispatch]);

  return (
    <Box
      sx={{
        width: "100%",
        flexGrow: 1,
        minHeight: 0,
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
          flexShrink: 0,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
        data-help={HelpItem.KindTabs}
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
        <Box
          sx={{
            display: "flex",
            flexShrink: 1,
            justifySelf: "flex-end",
          }}
        >
          <IconButton
            data-help={HelpItem.AddKindTab}
            onClick={handleOpenAddKindMenu}
            disableRipple
          >
            <Badge
              data-testid="minimized-badge"
              variant="dot"
              invisible={minimizedKinds.length === 0}
              color="primary"
              sx={{
                "& .MuiBadge-badge": {
                  top: 4,
                },
              }}
            >
              <AddIcon />
            </Badge>
          </IconButton>
        </Box>
      </Box>

      {visibleKinds.map((kind) => (
        <Box
          key={`annotation-grid-${kind.id}`}
          sx={{
            width: "100%",
            flexGrow: 1,
            minHeight: 0,
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
        filteredKinds={minimizedKinds}
      />
    </Box>
  );
};
