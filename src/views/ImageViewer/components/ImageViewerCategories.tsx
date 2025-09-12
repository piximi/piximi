import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, IconButton, List } from "@mui/material";
import { Visibility, VisibilityOff, MoreHoriz } from "@mui/icons-material";

import { useDialogHotkey, useMenu } from "hooks";

import { CollapsibleListItem } from "components/ui";
import { CategoryDialog } from "components/dialogs";
import { ImageViewerCategoryItem } from "./ImageViewerCategoryItem";
import { EditableKindField } from "./EditableKindField";

import { imageViewerSlice } from "../state/imageViewer";
import { selectFilteredImageViewerCategoryIds } from "../state/imageViewer/selectors";

import { HotkeyContext } from "utils/enums";
import { generateCategory } from "store/data/utils";
import { KindMenu } from "./KindMenu";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import {
  selectGetKindDisplayName,
  selectKindToAnnotationCategoryEntities,
} from "store/data/selectors";
import { dataSlice } from "store/data";

export const ImageViewerCategories = () => {
  const dispatch = useDispatch();
  const categoriesByKind = useSelector(selectKindToAnnotationCategoryEntities);

  const filteredCategoryIds = useSelector(selectFilteredImageViewerCategoryIds);
  const renderKindName = useSelector(selectGetKindDisplayName);
  // NOTE: keep for quick checking if kind is hidden
  const [filteredKinds, setFilteredKinds] = useState<Array<string>>([]);
  const [selectedKind, setSelectedKind] = useState<string>();
  const [editingKind, setEditingKind] = useState<string | undefined>(undefined);
  const editingKindRef = useRef<HTMLInputElement>(null);

  const {
    onClose: handleCloseCreateCategoryDialog,
    onOpen: handleOpenCreateCategoryDialog,
    open: isCreateCategoryDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);
  const {
    anchorEl: kindMenuAnchorEl,
    onClose: handleCloseKindMenu,
    onOpen: handleOpenKindMenu,
    open: kindMenuOpened,
  } = useMenu();

  const isKindFiltered = (kindId: string) => {
    //HACK: refactor -- O(n*m)
    return categoriesByKind[kindId].every((cat) => {
      return filteredCategoryIds.includes(cat.id);
    });
  };

  const handleToggleKindVisibility = (
    event: React.MouseEvent,
    kindId: string,
  ) => {
    event.stopPropagation();
    const categories = categoriesByKind[kindId];
    if (filteredKinds.includes(kindId)) {
      setFilteredKinds(
        filteredKinds.filter((hiddenKind) => hiddenKind !== kindId),
      );

      dispatch(
        imageViewerSlice.actions.removeFilters({
          categoryIds: categories.map((category) => category.id),
        }),
      );
    } else {
      setFilteredKinds([...filteredKinds, kindId]);
      dispatch(
        imageViewerSlice.actions.addFilters({
          categoryIds: categories.map((category) => category.id),
        }),
      );
    }
  };

  const handleOpenCreateCategoryOfKind = (
    event: React.MouseEvent,
    kind: string,
  ) => {
    event.stopPropagation();
    setSelectedKind(kind);
    handleOpenCreateCategoryDialog();
  };

  const handleCreateCategory = (kind: string, name: string, color: string) => {
    dispatch(
      dataSlice.actions.addCategory(generateCategory(name, kind, color)),
    );
  };

  const handleUpdateKindName = (kindId: string, newDisplayName: string) => {
    setEditingKind(undefined);
    if (newDisplayName.length === 0) {
      return;
    }
    dispatch(
      dataSlice.actions.updateKindName({
        id: kindId,
        newName: newDisplayName,
      }),
    );
  };

  const handleMenuCloseAndDeselectKind = () => {
    handleCloseKindMenu();
    setSelectedKind(undefined);
  };

  const handleDialogCloseAndDeselectKind = () => {
    handleCloseCreateCategoryDialog();
    setSelectedKind(undefined);
  };

  const handleEditKind = () => {
    handleCloseKindMenu();
    setEditingKind(selectedKind);
  };

  const handleDeleteKind = (kindId: string) => {
    dispatch(dataSlice.actions.deleteKindCascade(kindId));
  };

  const handleClearKindObjects = (kindId: string) => {
    dispatch(dataSlice.actions.deleteAnnotationsOfKind(kindId));
  };

  useEffect(() => {
    if (editingKind) {
      editingKindRef.current?.focus();
    }
  }, [editingKind]);

  return (
    <>
      <List dense sx={{ py: 0 }}>
        {Object.entries(categoriesByKind).map(([kindId, categories], idx) => {
          return (
            <CollapsibleListItem
              dense={true}
              indentSpacing={0}
              data-help={
                idx === 0 ? HelpItem.ImageViewerKindSection : undefined
              }
              disabledCollapse={editingKind === kindId}
              primaryText={
                <EditableKindField
                  kindId={kindId}
                  kindName={renderKindName(kindId)}
                  isEditing={editingKind === kindId}
                  onFinishedEditing={handleUpdateKindName}
                />
              }
              key={kindId}
              carotPosition="start"
              secondary={
                <Box
                  display="flex"
                  gap={1}
                  sx={(theme) => ({
                    "& .MuiIconButton-root": {
                      px: 0,
                      py: 0,
                      "&:hover": { color: theme.palette.primary.main },
                    },
                  })}
                >
                  <IconButton
                    disableRipple
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenKindMenu(event.currentTarget);
                      setSelectedKind(kindId);
                    }}
                  >
                    <MoreHoriz fontSize="small" />
                  </IconButton>
                  <IconButton
                    disableRipple
                    onClick={(event) =>
                      handleToggleKindVisibility(event, kindId)
                    }
                  >
                    {isKindFiltered(kindId) ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              }
            >
              {categories.map((category) => {
                return (
                  <ImageViewerCategoryItem
                    category={category}
                    kind={kindId}
                    key={category.id}
                  />
                );
              })}
              <Button
                variant="text"
                size="small"
                sx={{ width: "100%" }}
                onClick={(event) =>
                  handleOpenCreateCategoryOfKind(event, kindId)
                }
              >
                Add Category
              </Button>
            </CollapsibleListItem>
          );
        })}
      </List>
      {selectedKind && (
        <>
          <CategoryDialog
            kind={selectedKind}
            onClose={handleDialogCloseAndDeselectKind}
            open={isCreateCategoryDialogOpen}
            action="create"
            onConfirm={handleCreateCategory}
          />

          <KindMenu
            anchorEl={kindMenuAnchorEl}
            kindId={selectedKind}
            onClose={handleMenuCloseAndDeselectKind}
            opened={kindMenuOpened}
            onEdit={handleEditKind}
            deleteKind={handleDeleteKind}
            clearObjects={handleClearKindObjects}
          />
        </>
      )}
    </>
  );
};
