import { createContext, useCallback, useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dataSlice } from "store/data";
import { GeneralizedKindItem } from "store/data/types";
import { projectSlice } from "store/project";
import {
  selectActiveCategories,
  selectActiveKindItems,
} from "store/project/reselectors";
import {
  selectActiveKindId,
  selectExpandedTime,
} from "store/project/selectors";
import { Partition } from "utils/models/enums";

type KindOperations = {
  deleteSelectedItems: (itemIds: string[] | Record<string, string[]>) => void;
  deleteKindItemsOfCategory: (categoryId: string) => void;
  categorizeKindItem: (itemId: GeneralizedKindItem, categoryId: string) => void;
  categorizeSelectedKindItems: (
    selectedItems: string[] | Record<string, string[]>,
    categoryId: string,
  ) => void;
  repartitionKindItem: (itemId: string, partition: Partition) => void;
  repartitionSelectedKindItems: (
    selectedItems: string[] | Record<string, string[]>,
    partition: Partition,
  ) => void;
  selectKindItem: (item: GeneralizedKindItem) => void;
  deselectKindItem: (item: GeneralizedKindItem) => void;
  selectAllKindItems: () => void;
  deselectAllKindItems: () => void;
};

const KindItemsContext = createContext<KindOperations | null>(null);
export const KindItemsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const activeKindItems = useSelector(selectActiveKindItems);
  const activeCategories = useSelector(selectActiveCategories);
  const isExpandedTime = useSelector(selectExpandedTime);
  const [showCategoryRestriction, setShowCategoryRestriction] =
    useState<boolean>(false);

  const deleteSelectedItems = useCallback(
    (itemIds: string[] | Record<string, string[]>) => {
      if (activeKindId === "Image") {
        if (Array.isArray(itemIds)) {
          console.error("Cannot handle image ids as string array.");
          return;
        }
        dispatch(dataSlice.actions.batchDeleteImageTimepointCascade(itemIds));
      } else {
        dispatch(dataSlice.actions.batchDeleteAnnotations(itemIds as string[]));
      }
    },
    [dispatch, activeKindId],
  );

  const deleteKindItemsOfCategory = useCallback(
    (categoryId: string) => {
      if (activeKindId === "Image") {
        dataSlice.actions.deleteImageTimepointsByCategoryCascade(categoryId);
        return;
      }
      dataSlice.actions.deleteAnnotationsOfCategory(categoryId);
    },
    [activeKindId],
  );
  const categorizeKindItem = useCallback(
    (item: GeneralizedKindItem, categoryId: string) => {
      if (activeKindId === "Image") {
        if (!isExpandedTime) {
          setShowCategoryRestriction(true);
          return;
        }
        if (!item.timepoint) {
          console.error("No timepoint given for re-categorization");
          return;
        }
        dataSlice.actions.updateImageData({
          id: item.id,
          timepoint: item.timepoint,
          changes: { categoryId },
        });
        return;
      }
      dataSlice.actions.updateAnnotation({
        id: item.id,
        changes: { categoryId },
      });
    },
    [activeKindId],
  );
  const categorizeSelectedKindItems = useCallback(
    (
      selectedItems: string[] | Record<string, string[]>,
      categoryId: string,
    ) => {
      if (activeKindId === "Image") {
        if (Array.isArray(selectedItems)) {
          console.error("Cannot handle image ids as string array.");
          return;
        }
        dataSlice.actions.batchUpdateImageTimepoint({
          imageTimepoints: selectedItems,
          changes: { categoryId },
        });
        return;
      }
      dataSlice.actions.batchUpdateAnnotation(
        (selectedItems as string[]).map((id) => ({
          id,
          changes: { categoryId },
        })),
      );
    },
    [activeKindId],
  );

  const repartitionKindItem = useCallback(
    (itemId: string, partition: Partition) => {
      if (activeKindId === "Image") {
        dataSlice.actions.updateDefaultMetadataImage({
          id: itemId,
          changes: { partition },
        });
        return;
      }
      dataSlice.actions.updateAnnotation({
        id: itemId,
        changes: { partition },
      });
    },
    [activeKindId],
  );
  const repartitionSelectedKindItems = useCallback(
    (
      selectedItems: string[] | Record<string, string[]>,
      partition: Partition,
    ) => {
      if (activeKindId === "Image") {
        if (Array.isArray(selectedItems)) {
          console.error("Cannot handle image ids as string array.");
          return;
        }
        dataSlice.actions.batchUpdateImageData(
          Object.keys(selectedItems).map((item) => ({
            id: item,
            changes: { partition },
          })),
        );
        return;
      }
      dataSlice.actions.batchUpdateAnnotation(
        (selectedItems as string[]).map((id) => ({
          id,
          changes: { partition },
        })),
      );
    },
    [activeKindId],
  );

  const selectKindItem = useCallback(
    (item: GeneralizedKindItem) => {
      if (activeKindId === "Image") {
        projectSlice.actions.selectImages({
          selection: { id: item.id, timepoint: item.timepoint as string },
        });
      } else {
        projectSlice.actions.selectAnnotations({ ids: item.id });
      }
    },
    [activeKindId],
  );

  const deselectKindItem = useCallback(
    (item: GeneralizedKindItem) => {
      if (activeKindId === "Image") {
        projectSlice.actions.deselectImages({
          selection: { id: item.id, timepoint: item.timepoint as string },
        });
      } else {
        projectSlice.actions.deselectAnnotations({ ids: item.id });
      }
    },
    [activeKindId],
  );

  const selectAllKindItems = useCallback(() => {
    if (activeKindId === "Image") {
      projectSlice.actions.selectImages({
        selection: activeKindItems.map((item) => ({
          id: item.id,
          timepoint: item.timepoint as string,
        })),
      });
    } else {
      projectSlice.actions.selectAnnotations({
        ids: activeKindItems.map((item) => item.id),
      });
    }
  }, [activeKindId, activeKindItems]);

  const deselectAllKindItems = useCallback(() => {
    if (activeKindId === "Image") {
      projectSlice.actions.deselectImages({
        selection: activeKindItems.map((item) => ({
          id: item.id,
          timepoint: item.timepoint as string,
        })),
      });
    } else {
      projectSlice.actions.deselectAnnotations({
        ids: activeKindItems.map((item) => item.id),
      });
    }
  }, [activeKindId, activeKindItems]);

  const operations: KindOperations = {
    deleteSelectedItems,
    categorizeKindItem,
    categorizeSelectedKindItems,
    repartitionKindItem,
    repartitionSelectedKindItems,
    selectKindItem,
    selectAllKindItems,
    deselectKindItem,
    deselectAllKindItems,
    deleteKindItemsOfCategory,
  };

  return (
    <KindItemsContext.Provider value={operations}>
      {children}
    </KindItemsContext.Provider>
  );
};
export const useKindOperations = () => {
  const context = useContext(KindItemsContext);
  if (!context)
    throw new Error(
      "useKindOperations must be used within KindOperationsProvider",
    );
  return context;
};
