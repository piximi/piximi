import { createContext, useCallback, useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dataSlice } from "store/data";
import { IMAGE_KIND } from "store/data/constants";
import { selectCategoryToAllItems } from "store/data/selectors";
import {
  GeneralizedKindItem,
  GeneralizedKindItemEditableProps,
} from "store/data/types";
import { isUnknownCategory } from "store/data/utils";
import { projectSlice } from "store/project";
import {
  selectActiveKindId,
  selectExpandedTime,
} from "store/project/selectors";
import { Partition } from "utils/models/enums";

type KindOperations = {
  deleteSelectedItems: (itemIds: string[]) => void;
  deleteKindItemsOfCategory: (categoryId: string) => void;
  categorizeKindItem: (itemId: GeneralizedKindItem, categoryId: string) => void;
  categorizeSelectedKindItems: (
    selectedItems: string[],
    categoryId: string,
  ) => void;
  repartitionKindItem: (itemId: string, partition: Partition) => void;
  repartitionSelectedKindItems: (
    selectedItems: string[],
    partition: Partition,
  ) => void;
  updateKindItem: (
    id: string,
    changes: Partial<GeneralizedKindItemEditableProps>,
  ) => void;
  updateKindItemKind: (id: string, kind: string) => void;
};

const KindItemsContext = createContext<KindOperations | null>(null);
export const KindItemsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const categoryToItems = useSelector(selectCategoryToAllItems);
  const isExpandedTime = useSelector(selectExpandedTime);

  const [showCategoryRestriction, setShowCategoryRestriction] =
    useState<boolean>(false);

  const deleteSelectedItems = useCallback(
    (itemIds: string[]) => {
      if (activeKindId === IMAGE_KIND) {
        dispatch(dataSlice.actions.batchDeleteImageData(itemIds));
      } else {
        dispatch(dataSlice.actions.batchDeleteAnnotations(itemIds as string[]));
      }
      dispatch(projectSlice.actions.deselectKindItems(itemIds));
    },
    [dispatch, activeKindId],
  );

  const deleteKindItemsOfCategory = useCallback(
    (categoryId: string) => {
      if (activeKindId === IMAGE_KIND)
        dispatch(dataSlice.actions.deleteImageDataByCategory(categoryId));
      else dispatch(dataSlice.actions.deleteAnnotationsOfCategory(categoryId));
      dispatch(
        projectSlice.actions.deselectKindItems(categoryToItems[categoryId]),
      );
    },
    [activeKindId],
  );
  const categorizeKindItem = useCallback(
    (item: GeneralizedKindItem, categoryId: string) => {
      if (activeKindId === IMAGE_KIND) {
        if (!isExpandedTime) {
          setShowCategoryRestriction(true);
          return;
        }
        if (!item.timepoint) {
          console.error("No timepoint given for re-categorization");
          return;
        }
        dispatch(
          dataSlice.actions.updateImageData({
            id: item.id,
            changes: {
              categoryId,
              partition: isUnknownCategory(categoryId)
                ? Partition.Inference
                : Partition.Unassigned,
            },
          }),
        );
        return;
      }
      dispatch(
        dataSlice.actions.updateAnnotation({
          id: item.id,
          changes: {
            categoryId,
            partition: isUnknownCategory(categoryId)
              ? Partition.Inference
              : Partition.Unassigned,
          },
        }),
      );
    },
    [activeKindId],
  );
  const categorizeSelectedKindItems = useCallback(
    (selectedItems: string[], categoryId: string) => {
      if (activeKindId === IMAGE_KIND) {
        dispatch(
          dataSlice.actions.batchUpdateImageData(
            selectedItems.map((id) => ({
              id,
              changes: {
                categoryId,
                partition: isUnknownCategory(categoryId)
                  ? Partition.Inference
                  : Partition.Unassigned,
              },
            })),
          ),
        );
        return;
      }
      dispatch(
        dataSlice.actions.batchUpdateAnnotations(
          (selectedItems as string[]).map((id) => ({
            id,
            changes: {
              categoryId,
              partition: isUnknownCategory(categoryId)
                ? Partition.Inference
                : Partition.Unassigned,
            },
          })),
        ),
      );
    },
    [activeKindId],
  );

  const repartitionKindItem = useCallback(
    (itemId: string, partition: Partition) => {
      if (activeKindId === IMAGE_KIND) {
        dispatch(
          dataSlice.actions.updateImageData({
            id: itemId,
            changes: { partition },
          }),
        );
        return;
      }
      dispatch(
        dataSlice.actions.updateAnnotation({
          id: itemId,
          changes: { partition },
        }),
      );
    },
    [activeKindId],
  );
  const repartitionSelectedKindItems = useCallback(
    (
      selectedItems: string[] | Record<string, string[]>,
      partition: Partition,
    ) => {
      if (activeKindId === IMAGE_KIND) {
        if (Array.isArray(selectedItems)) {
          console.error("Cannot handle image ids as string array.");
          return;
        }
        dispatch(
          dataSlice.actions.batchUpdateImageData(
            Object.keys(selectedItems).map((item) => ({
              id: item,
              changes: { partition },
            })),
          ),
        );
        return;
      }
      dispatch(
        dataSlice.actions.batchUpdateAnnotations(
          (selectedItems as string[]).map((id) => ({
            id,
            changes: { partition },
          })),
        ),
      );
    },
    [activeKindId],
  );

  const updateKindItem = useCallback(
    (id: string, changes: Partial<GeneralizedKindItemEditableProps>) => {
      if (activeKindId === IMAGE_KIND)
        dispatch(
          dataSlice.actions.updateImageData({
            id,
            changes,
          }),
        );
      else
        dispatch(
          dataSlice.actions.updateAnnotation({
            id,
            changes,
          }),
        );
    },
    [activeKindId],
  );

  const updateKindItemKind = useCallback(
    (id: string, kind: string) => {
      if (activeKindId === IMAGE_KIND) return;
      dispatch(dataSlice.actions.updateAnnotation({ id, changes: { kind } }));
    },
    [activeKindId],
  );

  const operations: KindOperations = {
    deleteSelectedItems,
    categorizeKindItem,
    categorizeSelectedKindItems,
    repartitionKindItem,
    repartitionSelectedKindItems,
    deleteKindItemsOfCategory,
    updateKindItem,
    updateKindItemKind,
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
