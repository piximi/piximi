import {
  configureStore,
  createAction,
  createReducer,
  PayloadAction,
} from "@reduxjs/toolkit";
import state from "./index.json";
import { v4 } from "uuid";

export type Category = {
  color: string;
  id: string;
  name: string;
};
export type Photo = {
  category?: string;
  id: string;
  name: string;
  src: string;
};
type State = {
  categories: Array<Category>;
  photos: Array<Photo>;
};
const createCategoryAction = createAction<{ name: string }>("create-category");
const deleteCategoryAction = createAction<{ id: string }>("delete-category");
const updateCategoryNameAction = createAction<{
  category: string;
  name: string;
}>("update-category-name");
const updatePhotoCategoryAction = createAction<{
  photo: string;
  category: string;
}>("update-photo-category");
const reducer = createReducer(state, {
  [createCategoryAction.type]: (
    state: State,
    action: PayloadAction<Category>
  ) => {
    const category: Category = {
      color: "",
      id: v4().toString(),
      name: action.payload.name,
    };

    state.categories.push(category);
  },
  [deleteCategoryAction.type]: (
    state: State,
    action: PayloadAction<{ id: string }>
  ) => {
    return state.categories.filter((category: Category) => {
      return category.id !== action.payload.id;
    });
  },
  [updateCategoryNameAction.type]: (
    state: State,
    action: PayloadAction<{ category: string; name: string }>
  ) => {},
  [updatePhotoCategoryAction.type]: (
    state: State,
    action: PayloadAction<{ photo: string; category: string }>
  ) => {},
});

export const store = configureStore({ reducer: reducer });
