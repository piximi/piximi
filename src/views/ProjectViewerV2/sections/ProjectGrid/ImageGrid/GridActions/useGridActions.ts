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
  selectImageGridState,
} from "@ProjectViewer/state/selectors";
import { ViewState } from "@ProjectViewer/state/types";
import { useParameterizedSelector } from "store/hooks";
import { dataSliceV2 } from "store/dataV2/dataSliceV2";
import {
  selectAllCategories,
  selectAnnotationEntities,
  selectGridAnnotationsByKindId,
  selectRepresentativeImages,
} from "store/dataV2/selectors";
import { isFiltered } from "utils/arrayUtils";
import { useMemo } from "react";
import { TooltipTitle } from "components/ui";
import { useHotkeys } from "hooks";
import { HotkeyContext } from "utils/enums";

export const useGridActions = (viewState: ViewState) => {
  const dispatch = useDispatch();
  const images = useSelector(selectRepresentativeImages);
  const categories = useSelector(selectAllCategories);
  const activeKindState = useSelector(selectActiveKindState);
  const aactiveAnnotations = useParameterizedSelector(
    selectGridAnnotationsByKindId,
    activeKindState.id,
  );
  const annotationEntities = useSelector(selectAnnotationEntities);
  const imageGridState = useSelector(selectImageGridState);

  const activeCategories = useMemo(
    () =>
      categories.filter((c) => {
        if (viewState === "images") return c.type === "image";
        return c.type === "annotation" && c.kindId === activeKindState.id;
      }),
    [viewState, activeKindState, categories],
  );

  const filteredItems =
    viewState === "images"
      ? images.filter(
          (image) => !isFiltered(image, imageGridState.filters ?? {}),
        )
      : aactiveAnnotations.filter(
          (ann) => !isFiltered(ann, activeKindState.filters ?? {}),
        );

  const selectedItems =
    viewState === "images"
      ? imageGridState.selectedIds
      : activeKindState.selectedIds;

  const selectedFilteredItems = intersection(
    selectedItems,
    filteredItems.map((item) => item.id),
  );

  const allSelected = selectedFilteredItems.length === filteredItems.length;

  const handleDelete = () => {
    if (viewState === "images")
      dispatch(
        dataSliceV2.actions.batchDeleteImageObject(selectedFilteredItems),
      );
    else
      dispatch(
        dataSliceV2.actions.batchDeleteAnnotation(selectedFilteredItems),
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
      const payload = selectedFilteredItems.map((item) => ({
        imageId: item,
        categoryId,
      }));
      dispatch(dataSliceV2.actions.batchUpdateImageCategory(payload));
    } else {
      const payload = selectedFilteredItems.map((item) => ({
        volumeId: annotationEntities[item].volumeId,
        categoryId,
      }));
      dispatch(
        dataSliceV2.actions.batchUpdateAnnotationVolumeCategory(payload),
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
            selectedFilteredItems.length === 0
              ? SelectAllEmptyIcon
              : SelectAllIcon,
          disabled: filteredItems.length === 0,
        };

  useHotkeys(
    "esc",
    () => {
      selectedFilteredItems.length > 0 && handleDeselectAll();
    },
    HotkeyContext.ProjectView,
    [handleDeselectAll, selectedFilteredItems],
  );

  useHotkeys(
    "control+a",
    () => !allSelected && handleSelectAll(),
    HotkeyContext.ProjectView,
    [handleSelectAll],
  );

  return {
    filteredItems,
    selectedFilteredItems,
    handleDelete,
    activeCategories,
    handleCategorize,
    selectProps,
  };
};
