import { Draft } from "immer";
import { difference, merge } from "lodash";
import { AnnotationObject, Category, Kind } from "store/data/types";
import { DeferredEntity, RequireOnly } from "utils/types";
import {
  AnnotatorState,
  CategoryEdits,
  KindEdits,
} from "views/ImageViewer/utils/types";

const removeEditedKindContents = (
  editedKind: KindEdits,
  updates: { categories?: string[]; containing?: string[] },
) => {
  if (updates.categories) {
    if (editedKind.categories) {
      const preExistingCats = difference(
        updates.categories,
        editedKind.categories.added,
      );
      editedKind.categories.added = difference(
        editedKind.categories.added,
        updates.categories,
      );
      editedKind.categories.deleted.push(...preExistingCats);
    } else {
      editedKind.categories = {
        added: [] as string[],
        deleted: updates.categories,
      };
    }
  }
  if (updates.containing) {
    if (editedKind.containing) {
      const preExistingThings = difference(
        updates.containing,
        editedKind.containing.added,
      );
      editedKind.containing.added = difference(
        editedKind.containing.added,
        updates.containing,
      );
      editedKind.containing.deleted.push(...preExistingThings);
    } else {
      editedKind.containing = {
        added: [] as string[],
        deleted: updates.containing,
      };
    }
  }
};

const addEditedKindContents = (
  editedKind: KindEdits,
  updates: { categories?: string[]; containing?: string[] },
) => {
  if (updates.categories) {
    if (editedKind.categories) {
      editedKind.categories.added.push(...updates.categories);
    } else {
      editedKind.categories = {
        added: updates.categories,
        deleted: [],
      };
    }
  }
  if (updates.containing) {
    if (editedKind.containing) {
      editedKind.containing.added.push(...updates.containing);
    } else {
      editedKind.containing = {
        added: updates.containing,
        deleted: [],
      };
    }
  }
};

const removeAddedKindContents = (
  addedKind: Kind,
  updates: { categories?: string[]; containing?: string[] },
) => {
  if (updates.categories)
    addedKind.categories = difference(addedKind.categories, updates.categories);
  if (updates.containing)
    addedKind.containing = difference(addedKind.containing, updates.containing);
};

const addAddedKindContents = (
  addedKind: Kind,
  updates: { categories?: string[]; containing?: string[] },
) => {
  if (updates.categories) addedKind.categories.push(...updates.categories);
  if (updates.containing) addedKind.containing.push(...updates.containing);
};

export const removeKindContents = (
  state: Draft<AnnotatorState>,
  updates: { id: string; categories?: string[]; containing?: string[] },
) => {
  if (updates.id in state.changes.kinds.added) {
    const addedKind = state.changes.kinds.added[updates.id];
    removeAddedKindContents(addedKind, updates);
  } else if (updates.id in state.changes.kinds.edited) {
    const editedKind = state.changes.kinds.edited[updates.id];
    removeEditedKindContents(editedKind, updates);
  } else {
    state.changes.kinds.edited[updates.id] = {
      id: updates.id,
      categories: updates.categories
        ? { deleted: updates.categories, added: [] }
        : undefined,
      containing: updates.containing
        ? { deleted: updates.containing, added: [] }
        : undefined,
    };
  }
};

export const addKindContents = (
  state: Draft<AnnotatorState>,
  updates: { id: string; categories?: string[]; containing?: string[] },
) => {
  if (updates.id in state.changes.kinds.added) {
    const addedKind = state.changes.kinds.added[updates.id];
    addAddedKindContents(addedKind, updates);
  } else if (updates.id in state.changes.kinds.edited) {
    const editedKind = state.changes.kinds.edited[updates.id];
    addEditedKindContents(editedKind, updates);
  } else {
    state.changes.kinds.edited[updates.id] = {
      id: updates.id,
      categories: updates.categories
        ? { added: updates.categories, deleted: [] }
        : undefined,
      containing: updates.containing
        ? { added: updates.containing, deleted: [] }
        : undefined,
    };
  }
};

export const deleteKindEntry = (
  state: Draft<AnnotatorState>,
  kindId: string,
) => {
  if (kindId in state.changes.kinds.added) {
    delete state.changes.kinds.added[kindId];
    return;
  }
  if (kindId in state.changes.kinds.edited) {
    delete state.changes.kinds.edited[kindId];
  }
  state.changes.kinds.deleted.push(kindId);
};

export const updateKind = (
  state: Draft<AnnotatorState>,
  kind: Omit<RequireOnly<Kind, "id">, "categories" | "containing">,
) => {
  if (kind.id in state.changes.kinds.added) {
    merge(state.changes.kinds.added[kind.id], kind);
  } else if (kind.id in state.changes.kinds.edited) {
    merge(state.changes.kinds.edited[kind.id], kind);
  } else {
    state.changes.kinds.edited[kind.id] = kind;
  }
};

//-------------------------------------------------------------------------
const removeEditedCategoryContents = (
  editedCategory: CategoryEdits,
  containing: string[],
) => {
  if (editedCategory.containing) {
    const preExistingThings = difference(
      containing,
      editedCategory.containing.added,
    );
    editedCategory.containing.added = difference(
      editedCategory.containing.added,
      containing,
    );
    editedCategory.containing.deleted.push(...preExistingThings);
  } else {
    editedCategory.containing = {
      added: [] as string[],
      deleted: containing,
    };
  }
};

const addEditedCategoryContents = (
  editedCategory: CategoryEdits,
  containing: string[],
) => {
  if (editedCategory.containing) {
    editedCategory.containing.added.push(...containing);
  } else {
    editedCategory.containing = {
      added: containing,
      deleted: [],
    };
  }
};

const removeAddedCategoryContents = (
  addedCategory: Category,
  containing: string[],
) => {
  addedCategory.containing = difference(addedCategory.containing, containing);
};

const addAddedCategoryContents = (
  addedCategory: Category,
  containing: string[],
) => {
  addedCategory.containing.push(...containing);
};

export const removeCategoryContents = (
  state: Draft<AnnotatorState>,
  id: string,
  containing: string[],
) => {
  if (id in state.changes.categories.added) {
    const addedCategory = state.changes.categories.added[id];
    removeAddedCategoryContents(addedCategory, containing);
  } else if (id in state.changes.categories.edited) {
    const editedKind = state.changes.categories.edited[id];
    removeEditedCategoryContents(editedKind, containing);
  } else {
    state.changes.categories.edited[id] = {
      id,
      containing: { deleted: containing, added: [] },
    };
  }
};

export const addCategoryContents = (
  state: Draft<AnnotatorState>,
  id: string,
  containing: string[],
) => {
  if (id in state.changes.categories.added) {
    const addedCategory = state.changes.categories.added[id];
    addAddedCategoryContents(addedCategory, containing);
  } else if (id in state.changes.categories.edited) {
    const editedCategory = state.changes.categories.edited[id];
    addEditedCategoryContents(editedCategory, containing);
  } else {
    state.changes.categories.edited[id] = {
      id,
      containing: { added: containing, deleted: [] },
    };
  }
};

export const deleteCategoryEntry = (
  state: Draft<AnnotatorState>,
  categoryId: string,
) => {
  if (categoryId in state.changes.categories.added) {
    delete state.changes.categories.added[categoryId];
    return;
  }
  if (categoryId in state.changes.categories.edited)
    delete state.changes.categories.edited[categoryId];

  state.changes.categories.deleted.push(categoryId);
};

export const editCategory = (
  state: Draft<AnnotatorState>,
  category: Omit<RequireOnly<Category, "id">, "containing">,
) => {
  if (category.id in state.changes.categories.added) {
    merge(state.changes.categories.added[category.id], category);
  } else if (category.id in state.changes.categories.edited) {
    merge(state.changes.categories.edited[category.id], category);
  } else {
    state.changes.categories.edited[category.id] = category;
  }
};

export const deleteThingEntry = (
  state: Draft<AnnotatorState>,
  thingId: string,
) => {
  if (thingId in state.changes.things.added) {
    delete state.changes.things.added[thingId];
    return;
  }
  if (thingId in state.changes.things.edited)
    delete state.changes.things.edited[thingId];

  state.changes.things.deleted.push(thingId);
};

export const deleteAnnotationEntry = (
  state: Draft<AnnotatorState>,
  annId: string,
) => {
  if (annId in state.changes.annotations.added) {
    delete state.changes.annotations.added[annId];
    return;
  }
  if (annId in state.changes.annotations.edited)
    delete state.changes.annotations.edited[annId];

  state.changes.annotations.deleted.push(annId);
};

export const updateThing = (
  state: Draft<AnnotatorState>,
  thing: RequireOnly<AnnotationObject, "id">,
) => {
  if (thing.id in state.changes.things.added) {
    merge(state.changes.things.added[thing.id], thing);
  } else if (thing.id in state.changes.things.edited) {
    merge(state.changes.things.edited[thing.id], thing);
  } else {
    state.changes.things.edited[thing.id] = thing;
  }
};

export const updateAnnotation = (
  state: Draft<AnnotatorState>,
  annotation: RequireOnly<AnnotationObject, "id">,
) => {
  if (annotation.id in state.changes.annotations.added) {
    merge(state.changes.annotations.added[annotation.id], annotation);
  } else if (annotation.id in state.changes.annotations.edited) {
    merge(state.changes.annotations.edited[annotation.id], annotation);
  } else {
    state.changes.annotations.edited[annotation.id] = annotation;
  }
};

export function getCompleteEntity<T>(entity: DeferredEntity<T>): T | undefined {
  if (entity.changes.deleted) return;
  const {
    added: _added,
    deleted: _deleted,
    ...completeEntity
  } = {
    ...entity.saved,
    ...entity.changes,
  };
  return completeEntity as T;
}
