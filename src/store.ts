import {
  configureStore,
  createAction,
  createReducer,
  PayloadAction,
} from "@reduxjs/toolkit";
import { v4 } from "uuid";

export type Category = {
  color: string;
  id: string;
  name: string;
};

export type Image = {
  categoryId?: string;
  id: string;
  name: string;
  src: string;
};

export type Project = {
  categories: Array<Category>;
  name: string;
  images: Array<Image>;
};

type State = {
  project?: Project;
};

const state: State = {
  project: {
    categories: [
      {
        color: "",
        id: "91fdbc1f-b654-4150-9fe3-53d28c4287c4",
        name: "Cell membrane",
      },
      {
        color: "",
        id: "8039cf80-6ad6-4c57-8001-871765905c5b",
        name: "Nucleus",
      },
      {
        color: "",
        id: "00000000-0000-0000-0000-000000000000",
        name: "Unknown",
      },
    ],
    images: [
      {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: "6aab03f4-eae5-4eb4-82a0-236068a07c56",
        name: "foo",
        src: "https://picsum.photos/seed/1/512/512",
      },
      {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: "1103d28a-ac3d-4980-af54-7d8375dbf791",
        name: "foo",
        src: "https://picsum.photos/seed/2/512/512",
      },
      {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: "ca874261-0300-414d-95d7-7ceb2e5de52f",
        name: "foo",
        src: "https://picsum.photos/seed/3/512/512",
      },
      {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: "c9a26b6b-1226-4e54-9f9e-d3e710cd7308",
        name: "foo",
        src: "https://picsum.photos/seed/4/512/512",
      },
      {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: "589a5fc5-a01a-4346-8a70-1f89f0abcb95",
        name: "foo",
        src: "https://picsum.photos/seed/5/512/512",
      },
      {
        categoryId: "00000000-0000-0000-0000-000000000000",
        id: "6593fa38-bb6b-46d7-92d2-98a80c695312",
        name: "foo",
        src: "https://picsum.photos/seed/6/512/512",
      },
    ],
    name: "Untitled project",
  },
};

export const createCategoryAction = createAction<{ name: string }>(
  "create-category"
);

export const deleteCategoryAction = createAction<{ id: string }>(
  "delete-category"
);

export const updateCategoryNameAction = createAction<{
  id: string;
  name: string;
}>("update-category-name");

export const updatePhotoCategoryAction = createAction<{
  id: string;
  categoryId: string;
}>("update-photo-category");

const reducer = createReducer(
  {},
  {
    [createCategoryAction.type]: (
      state: State,
      action: PayloadAction<{ name: string }>
    ) => {
      const category: Category = {
        color: "#00FFFF",
        id: v4().toString(),
        name: action.payload.name,
      };

      state.project?.categories.push(category);
    },
    [deleteCategoryAction.type]: (
      state: State,
      action: PayloadAction<{ id: string }>
    ) => {
      return state.project?.categories.filter((category: Category) => {
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
  }
);

export const store = configureStore({ reducer: reducer });
