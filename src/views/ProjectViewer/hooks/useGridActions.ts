import { useDispatch, useSelector } from "react-redux";

import { intersection } from "lodash";

import { useHotkeys } from "hooks";

import { projectSlice } from "@ProjectViewer/state";
import {
  selectActiveKindState,
  selectActiveSelectedIds,
  selectActiveView,
} from "@ProjectViewer/state/selectors";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import {
  selectActiveCategories,
  selectVisibleItems,
} from "@ProjectViewer/state/reselectors";

import { HotkeyContext } from "utils/enums";

export const useGridActions = () => {
  const dispatch = useDispatch();
  const viewState = useSelector(selectActiveView);
  const activeKindState = useSelector(selectActiveKindState);
  const activeCategories = useSelector(selectActiveCategories);
  const selectedItems = useSelector(selectActiveSelectedIds);
  const filteredItems = useSelector(selectVisibleItems);

  const selectedFilteredItemIds = intersection(
    selectedItems,
    filteredItems.map((item) => item.id),
  );

  const allSelected = selectedFilteredItemIds.length === filteredItems.length;
  const hasItems = !!filteredItems.length;

  const handleDelete = () => {
    if (viewState === "images")
      dispatch(
        dataSliceV2.actions.batchDeleteImageObject(selectedFilteredItemIds),
      );
    else
      dispatch(
        dataSliceV2.actions.batchDeleteAnnotation(selectedFilteredItemIds),
      );
  };
  const handleSelectAll = () => {
    if (viewState === "images") {
      dispatch(
        projectSlice.actions.addSelectedImages(
          filteredItems.map((item) => item.id),
        ),
      );
    } else {
      dispatch(
        projectSlice.actions.addSelectedAnnotations({
          kindId: activeKindState.id,
          ids: filteredItems.map((item) => item.id),
        }),
      );
    }
  };
  const handleDeselectAll = () => {
    if (viewState === "images") {
      dispatch(
        projectSlice.actions.removeSelectedImages(
          filteredItems.map((item) => item.id),
        ),
      );
    } else {
      dispatch(
        projectSlice.actions.removeSelectedAnnotations({
          kindId: activeKindState.id,
          ids: filteredItems.map((item) => item.id),
        }),
      );
    }
  };

  const handleCategorize = (categoryId: string) => {
    const payload = selectedFilteredItemIds.map((item) => ({
      id: item,
      categoryId,
    }));
    if (viewState === "images") {
      dispatch(dataSliceV2.actions.batchUpdateImageCategory(payload));
    } else {
      dispatch(
        dataSliceV2.actions.batchBubbleUpdateAnnotationCategory(payload),
      );
    }
  };

  useHotkeys(
    "esc",
    () => {
      selectedFilteredItemIds.length > 0 && handleDeselectAll();
    },
    HotkeyContext.ProjectView,
    [handleDeselectAll, selectedFilteredItemIds],
  );

  useHotkeys(
    "control+a",
    () => !allSelected && handleSelectAll(),
    HotkeyContext.ProjectView,
    [handleSelectAll],
  );

  return {
    filteredItems,
    selectedFilteredItemIds,
    allSelected,
    hasItems,
    handleDelete,
    activeCategories,
    handleCategorize,
    handleDeselectAll,
    handleSelectAll,
  };
};
