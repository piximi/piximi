import { intersection } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import {
  Deselect as DeselectIcon,
  HighlightAltOutlined as SelectAllEmptyIcon,
  SelectAll as SelectAllIcon,
} from "@mui/icons-material";
import { projectSlice } from "@ProjectViewer/state";
import {
  selectActiveKindState,
  selectActiveSelectedIds,
} from "@ProjectViewer/state/selectors";
import { ViewState } from "@ProjectViewer/state/types";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import { TooltipTitle } from "components/ui";
import { useHotkeys } from "hooks";
import { HotkeyContext } from "utils/enums";
import {
  selectActiveCategories,
  selectVisibleItems,
} from "@ProjectViewer/state/reselectors";

export const useGridActions = (viewState: ViewState) => {
  const dispatch = useDispatch();
  const activeKindState = useSelector(selectActiveKindState);
  const activeCategories = useSelector(selectActiveCategories);
  const selectedItems = useSelector(selectActiveSelectedIds);
  const filteredItems = useSelector(selectVisibleItems);

  const selectedFilteredItemIds = intersection(
    selectedItems,
    filteredItems.map((item) => item.id),
  );

  const allSelected = selectedFilteredItemIds.length === filteredItems.length;

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
    if (viewState === "images") {
      const payload = selectedFilteredItemIds.map((item) => ({
        imageId: item,
        categoryId,
      }));
      dispatch(dataSliceV2.actions.batchUpdateImageCategory(payload));
    } else {
      const payload = selectedFilteredItemIds.map((item) => ({
        annotationId: item,
        categoryId,
      }));
      dispatch(
        dataSliceV2.actions.batchBubbleUpdateAnnotationCategory(payload),
      );
    }
  };

  const selectProps =
    allSelected === true
      ? {
          tooltipTitle: TooltipTitle(`Deselect`, "esc"),
          onClick: handleDeselectAll,
          dataTestId: "deselect-all-button",
          icon: DeselectIcon,
          disabled: filteredItems.length === 0,
        }
      : {
          tooltipTitle: TooltipTitle(`Select all`, "control", "a"),
          onClick: handleSelectAll,
          dataTestId: "select-all-button",
          icon:
            selectedFilteredItemIds.length === 0
              ? SelectAllEmptyIcon
              : SelectAllIcon,
          disabled: filteredItems.length === 0,
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
    selectedFilteredItems: selectedFilteredItemIds,
    handleDelete,
    activeCategories,
    handleCategorize,
    selectProps,
  };
};
