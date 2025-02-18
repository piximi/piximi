import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, IconButton, List } from "@mui/material";
import { Visibility, VisibilityOff, Add } from "@mui/icons-material";

import { useDialogHotkey } from "hooks";

import { CollapsibleListItem } from "components/ui/CollapsibleListItem";
import { ImageViewerCategoryItem } from "./ImageViewerCategoryItem";

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
    [categoriesByKind],
  );
  const filteredCategoryIds = useSelector(selectFilteredImageViewerCategoryIds);
  // NOTE: keep for quick checking if kind is hidden
  const [filteredKinds, setFilteredKinds] = useState<Array<string>>([]);
  const [selectedKind, setSelectedKind] = useState<string>();

  const {
    onClose: handleCloseCreateCategoryDialog,
    onOpen: handleOpenCreateCategoryDialog,
    open: isCreateCategoryDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const isKindFiltered = (kindId: string) => {
    //HACK: refactor -- O(n*m)
    return categoriesByKind[kindId].categories.every((cat) => {
      return filteredCategoryIds.includes(cat.id);
    });
  };

  const handleToggleKindVisibility = (
    event: React.MouseEvent,
    kindId: string,
  ) => {
    event.stopPropagation();
    const categories = categoriesByKind[kindId].categories;
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
      }),
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
                    <Add fontSize="small" />
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
            </CollapsibleListItem>
          );
        })}
      </List>
      {selectedKind && (
        <CategoryDialog
          kind={selectedKind}
          onClose={handleCloseCreateCategoryDialog}
          open={isCreateCategoryDialogOpen}
          action="create"
          onConfirm={handleCreateCategory}
        />
      )}
    </>
  );
};
