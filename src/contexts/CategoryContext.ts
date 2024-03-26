import { createContext } from "react";

import { Category, PartialBy, UNKNOWN_IMAGE_CATEGORY } from "types";

export const CategoryContext = createContext({
  createdCategories: [] as Category[],
  hasPredictions: false,
  isCategoryFiltered: (categoryId: string) => false,
  selectedCategory: undefined,
  highlightedCategory: undefined,
  unknownCategory: UNKNOWN_IMAGE_CATEGORY,
  anyFiltered: false,
  getObjectCountPerCategory: (categoryId: string) => 0,
  unavailableNames: [],
  availableColors: [],
  selectCategory: (category: Category) => {},
  toggleCategoryFilter: (category: Category) => {},
  filterOthers: (category?: Category) => {},
  unfilterCategories: () => {},
  deleteObjectsOfCategory: (categoryId: string) => {},
  deleteCategories: (categories: Category | Category[]) => {},
  upsertCategory: (category: PartialBy<Category, "id" | "visible">) => {},
} as {
  createdCategories: Category[];
  hasPredictions: boolean;
  isCategoryFiltered: (categoryId: string) => boolean;
  selectedCategory: Category | undefined;
  highlightedCategory: string | undefined;
  unknownCategory: Category;
  anyFiltered: boolean;
  getObjectCountPerCategory: (categoryId: string) => number;
  unavailableNames: string[];
  availableColors: string[];
  selectCategory: (category: Category) => void;
  toggleCategoryFilter: (category: Category) => void;
  filterOthers: (category?: Category) => void;
  unfilterCategories: () => void;
  deleteObjectsOfCategory: (categoryId: string) => void;
  deleteCategories: (categories: Category | Category[]) => void;
  upsertCategory: (category: PartialBy<Category, "id" | "visible">) => void;
});
