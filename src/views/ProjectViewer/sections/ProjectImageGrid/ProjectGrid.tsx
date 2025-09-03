import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box } from "@mui/material";

import { useMenu, useMobileView } from "hooks";

import { CustomTabs } from "components/layout";
import { AddKindMenu } from "./AddKindMenu";

import { projectSlice } from "store/project";
import { dataSlice } from "store/data";
import {
  selectActiveKindId,
  selectKindTabFilters,
} from "store/project/selectors";
import { selectKindEntities } from "store/data/selectors";
import { selectVisibleKinds } from "store/project/reselectors";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { DIMENSIONS } from "utils/constants";
import { KindItemGrid } from "./KindItemGrid";
import { IMAGE_KIND } from "store/data/constants";

export const ProjectGrid = () => {
  const dispatch = useDispatch();
  const filteredKinds = useSelector(selectKindTabFilters) as string[];
  const activeKind = useSelector(selectActiveKindId);
  const kinds = useSelector(selectKindEntities);
  const visibleKinds = useSelector(selectVisibleKinds) as string[];
  const isMobile = useMobileView();

  const [width, setWidth] = useState<number>(
    window.innerWidth - DIMENSIONS.leftDrawerWidth - DIMENSIONS.toolDrawerWidth,
  );
  const [height, setHeight] = useState<number>(
    window.innerHeight - DIMENSIONS.toolDrawerWidth,
  );

  //useDefaultImage(DispatchLocation.ImageViewer);
  useLayoutEffect(() => {
    const resizeHandler = () => {
      const width = !isMobile
        ? window.innerWidth -
          DIMENSIONS.leftDrawerWidth -
          DIMENSIONS.toolDrawerWidth
        : window.innerWidth - DIMENSIONS.toolDrawerWidth;

      setWidth(width);
      setHeight(window.innerHeight - DIMENSIONS.toolDrawerWidth);
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [isMobile]);
  const {
    onOpen: handleOpenAddKindMenu,
    onClose: handleCloseAddKindMenu,
    open: isAddKindMenuOpen,
    anchorEl: addKindMenuAnchor,
  } = useMenu();

  const handleTabClose = useCallback(
    (item: string, newItem?: string) => {
      if (newItem) {
        dispatch(projectSlice.actions.setActiveKind({ kind: newItem }));
      }

      dispatch(dataSlice.actions.deleteKindCascade(item));
    },
    [dispatch],
  );

  const handleTabMinimize = useCallback(
    (item: string, newItem?: string) => {
      if (newItem) {
        dispatch(projectSlice.actions.setActiveKind({ kind: newItem }));
      }

      dispatch(projectSlice.actions.addKindTabFilter({ kindId: item }));
    },
    [dispatch],
  );

  const handleTabChange = (tab: string) => {
    dispatch(projectSlice.actions.setActiveKind({ kind: tab }));
    dispatch(
      projectSlice.actions.changeActiveCategory({
        categoryId: kinds[tab]!.unknownCategoryId,
      }),
    );
  };

  const handleKindEdit = (kindId: string, newDisplayName: string) => {
    dispatch(
      dataSlice.actions.updateKindName({
        id: kindId,
        newName: newDisplayName,
      }),
    );
  };

  const renderTabLabel = useCallback(
    (label: string) => kinds[label].displayName,
    [kinds],
  );

  useEffect(() => {
    if (isMobile) {
      const minimizeOnResize = visibleKinds.filter(
        (kind) => kind !== activeKind,
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
    <Box
      sx={(theme) => ({
        width: width,
        height: height,
        gridArea: "image-grid",
        border: `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
        flexGrow: 1,
        borderRadius: "4px 4px 0 0",
      })}
    >
      <CustomTabs
        tabHelp={{
          tabBar: HelpItem.KindTabs,
          create: HelpItem.AddKindTab,
        }}
        extendable
        transition="sliding"
        childClassName="grid-tabs"
        labels={visibleKinds}
        secondaryEffect={handleTabChange}
        handleTabClose={handleTabClose}
        handleNew={handleOpenAddKindMenu}
        handleTabMin={handleTabMinimize}
        persistentTabs={[IMAGE_KIND]}
        editable
        handleTabEdit={handleKindEdit}
        renderLabel={renderTabLabel}
      >
        {visibleKinds.map((kind) => (
          <KindItemGrid key={`${kind}-itemGrid`} />
        ))}
      </CustomTabs>
      <AddKindMenu
        anchor={addKindMenuAnchor}
        isOpen={isAddKindMenuOpen}
        onClose={handleCloseAddKindMenu}
        filteredKinds={filteredKinds}
      />
    </Box>
  );
};
