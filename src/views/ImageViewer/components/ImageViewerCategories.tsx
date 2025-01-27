import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, IconButton, List } from "@mui/material";
import { Visibility, VisibilityOff, Add, MoreHoriz } from "@mui/icons-material";

import { useDialogHotkey, useMenu } from "hooks";

import { CollapsibleListItem } from "components/ui/CollapsibleListItem";
import { ImageViewerCategoryItem } from "./ImageViewerCategoryItem";
import { EditableKindField } from "./EditableKindField";

import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { selectFilteredImageViewerCategoryIds } from "views/ImageViewer/state/imageViewer/selectors";
import { selectCategoriesByKind } from "../state/annotator/reselectors";

import { HotkeyContext } from "utils/common/enums";

import { CategoryDialog } from "components/dialogs/CategoryDialog/CategoryDialog";
import { annotatorSlice } from "../state/annotator";
import { generateUUID } from "utils/common/helpers";

export const ImageViewerCategories = () => {
  const dispatch = useDispatch();
  const categoriesByKind = useSelector(selectCategoriesByKind);
  const categoriesByKindArray = useMemo(
    () => Object.values(categoriesByKind),
    [categoriesByKind]
  );
  const filteredCategoryIds = useSelector(selectFilteredImageViewerCategoryIds);
  const things = useSelector(selectImageViewerObjects);
  const renderKindName = useSelector(renderImageViewerKindName);
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
    return categoriesByKind[kindId].categories.every((cat) => {
      return filteredCategoryIds.includes(cat.id);
    });
  };

  const handleToggleKindVisibility = (
    event: React.MouseEvent,
    kindId: string
  ) => {
    event.stopPropagation();
    const categories = categoriesByKind[kindId].categories;
    if (filteredKinds.includes(kindId)) {
      setFilteredKinds(
        filteredKinds.filter((hiddenKind) => hiddenKind !== kindId)
      );

      dispatch(
        imageViewerSlice.actions.removeFilters({
          categoryIds: categories.map((category) => category.id),
        })
      );
    } else {
      setFilteredKinds([...filteredKinds, kindId]);
      dispatch(
        imageViewerSlice.actions.addFilters({
          categoryIds: categories.map((category) => category.id),
        })
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

  const handleCreateCategory = (name: string, color: string, kind: string) => {
    const newId = generateUUID();
    dispatch(
      annotatorSlice.actions.addCategories({
        categories: {
          id: newId,
          name,
          color,
          kind: kind,
          containing: [],
          visible: true,
        },
      })
    );
  };

  return (
    <>
      <List dense sx={{ py: 0 }}>
        {categoriesByKindArray.map(({ kindId, categories }) => {
          return (
            <CollapsibleListItem
              primaryText={kindId}
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
                      handleOpenCreateCategoryOfKind(event, kindId);
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
              <CustomListItemButton
                primaryText="Add Category"
                icon={<Add fontSize="small" />}
                onClick={(event) =>
                  handleOpenCreateCategoryOfKind(event, kindId)
                }
              />
            </CollapsibleListItem>
          );
        })}
      </List>
      {selectedKind && (
        <CategoryDialog
          kind={selectedKind}
          onClose={handleCloseCreateCategoryDialog}
          open={isCreateCategoryDialogOpen}
          action="Create"
          onConfirm={handleCreateCategory}
        />
      )}
    </>
  );
};
