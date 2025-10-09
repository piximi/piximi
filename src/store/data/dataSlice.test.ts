import { tensor4d, setBackend } from "@tensorflow/tfjs";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { dataSlice } from "./dataSlice";
import {
  categorySelectors,
  selectAllCategories,
  selectAllMetadata,
  selectAllImageData,
  selectAllAnnotations,
  kindSelectors,
} from "./selectors";
import {
  Kind,
  Category,
  ImageMetadata,
  ImageData,
  AnnotationObject,
} from "./types";
import { Partition } from "utils/models/enums";
import { selectAllKinds } from "./selectors";
import { generateUUID } from "./utils";
import { IMAGE_KIND } from "./constants";
import { RootState } from "store/rootReducer";

setBackend("cpu");

// Mock data factories
const createMockKind = (
  overrides: Partial<Omit<Kind, "unknownCategoryId">> = {},
): { kind: Kind; unknownCategory: Category } => {
  const kindId = overrides.id ?? "kind1";
  const unknownCatId = generateUUID({ definesUnknown: true });

  return {
    kind: {
      id: kindId,
      displayName: "Test Kind",
      unknownCategoryId: unknownCatId,
      ...overrides,
    },
    unknownCategory: {
      id: unknownCatId,
      name: "unknown-category",
      color: "#FF0000",
      visible: true,
      kind: kindId,
    },
  };
};

const createMockCategory = (overrides = {}): Category => ({
  id: "cat1",
  name: "Test Category",
  color: "#FF0000",
  visible: true,
  kind: "kind1",
  ...overrides,
});

const createMockImageMetadata = (overrides = {}): ImageMetadata => ({
  id: "meta1",
  name: "Test Metadata",
  kind: IMAGE_KIND,
  bitDepth: 8,
  timeSeries: true,
  shape: { width: 100, height: 100, planes: 1, channels: 1 },
  imageDataIds: ["img1"],
  defaultImageId: "img1",
  ...overrides,
});

const createMockImageData = (overrides = {}): ImageData => ({
  id: "img1",
  name: "img1",
  metadataId: "meta1",
  timepoint: 0,
  partition: Partition.Inference,
  categoryId: "cat1",
  src: "test.png",
  activePlane: 0,
  colors: {
    color: [
      [0, 0, 0],
      [1, 1, 1],
    ],
    range: { 0: [0, 1] },
    visible: { 0: true },
  },
  data: tensor4d([
    [
      [[1], [2]],
      [[3], [4]],
    ],
  ]),
  ...overrides,
});

const createMockAnnotation = (overrides = {}): AnnotationObject => ({
  id: "ann1",
  name: "Test Annotation",
  kind: "annotation-kind",
  bitDepth: 8,
  src: "test.png",
  partition: Partition.Inference,
  boundingBox: [0, 0, 10, 10],
  encodedMask: [1, 2, 3],
  plane: 0,
  imageId: "img1",
  timepoint: 0,
  categoryId: "cat1",
  shape: { width: 100, height: 100, planes: 1, channels: 1 },
  data: tensor4d([
    [
      [[1], [2]],
      [[3], [4]],
    ],
  ]),
  ...overrides,
});

describe("Data Slice", () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: { data: dataSlice.reducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });
  });

  const getState = () => store.getState() as RootState;

  describe("Kind Operations", () => {
    it("should add a kind", () => {
      const kindAndCat = createMockKind();
      store.dispatch(dataSlice.actions.addKind(kindAndCat));
      const state = getState();
      const dataState = state.data;
      const allKinds = kindSelectors.selectAll(state);
      const allCategories = categorySelectors.selectAll(state);
      expect(allKinds).toContainEqual(kindAndCat.kind);
      expect(allCategories).toContainEqual(kindAndCat.unknownCategory);
      expect(dataState.relationships.kindToCategories["kind1"]).toEqual([
        kindAndCat.unknownCategory.id,
      ]);
      expect(dataState.relationships.kindToAnnotations["kind1"]).toEqual([]);
    });

    it("should update a kind name", () => {
      const kind = createMockKind();
      store.dispatch(dataSlice.actions.addKind(kind));
      store.dispatch(
        dataSlice.actions.updateKindName({
          id: "kind1",
          newName: "Updated Kind",
        }),
      );

      const state = getState().data;
      const updatedKind = state.kinds.entities["kind1"];
      expect(updatedKind?.displayName).toBe("Updated Kind");
    });

    it("should delete a kind without cascade", () => {
      const kind = createMockKind();
      store.dispatch(dataSlice.actions.addKind(kind));
      store.dispatch(dataSlice.actions.deleteKind("kind1"));

      const state = getState().data;
      expect(state.kinds.entities["kind1"]).toBeUndefined();
      expect(state.relationships.kindToCategories["kind1"]).toBeUndefined();
      expect(state.relationships.kindToAnnotations["kind1"]).toBeUndefined();
    });

    it("should not delete Images kind on cascade delete", () => {
      const kind = createMockKind({ id: "Images" });
      store.dispatch(dataSlice.actions.addKind(kind));
      store.dispatch(dataSlice.actions.deleteKindCascade("Images"));

      const state = getState().data;
      expect(state.kinds.entities["Images"]).toBeDefined();
    });

    it("should cascade delete a kind with all related entities", () => {
      // Setup: Create a kind with category and annotation
      const kind = createMockKind();
      const category = createMockCategory({ kind: "kind1" });
      const annotation = createMockAnnotation({ kind: "kind1" });

      store.dispatch(dataSlice.actions.addKind(kind));
      store.dispatch(dataSlice.actions.addCategory(category));
      store.dispatch(dataSlice.actions.addAnnotation(annotation));

      // Verify setup
      let state = getState().data;
      expect(state.kinds.entities["kind1"]).toBeDefined();
      expect(state.categories.entities["cat1"]).toBeDefined();
      expect(state.annotations.entities["ann1"]).toBeDefined();
      expect(state.relationships.kindToCategories["kind1"]).toContain("cat1");
      expect(state.relationships.kindToAnnotations["kind1"]).toContain("ann1");

      // Cascade delete
      store.dispatch(dataSlice.actions.deleteKindCascade("kind1"));

      // Verify all entities are deleted
      state = getState().data;
      expect(state.kinds.entities["kind1"]).toBeUndefined();
      expect(state.categories.entities["cat1"]).toBeUndefined();
      expect(state.annotations.entities["ann1"]).toBeUndefined();
      expect(state.relationships.kindToCategories["kind1"]).toBeUndefined();
      expect(state.relationships.kindToAnnotations["kind1"]).toBeUndefined();
    });

    it("should batch add kinds", () => {
      const kinds = [
        createMockKind({ id: "kind1" }),
        createMockKind({ id: "kind2", displayName: "Kind 2" }),
        createMockKind({ id: "kind3", displayName: "Kind 3" }),
      ];

      store.dispatch(dataSlice.actions.batchAddKind(kinds));

      const state = getState().data;
      expect(state.kinds.entities["kind1"]).toBeDefined();
      expect(state.kinds.entities["kind2"]).toBeDefined();
      expect(state.kinds.entities["kind3"]).toBeDefined();
    });
  });

  describe("Category Operations", () => {
    beforeEach(() => {
      // Most category tests need a kind
      const kind = createMockKind();
      store.dispatch(dataSlice.actions.addKind(kind));
    });
    it("should not add unknown category directly", () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const category = createMockCategory({
        id: generateUUID({ definesUnknown: true }),
        name: "unknown-category",
        kind: "kind2",
      });
      store.dispatch(dataSlice.actions.addCategory(category));

      const state = getState().data;
      expect(state.categories.entities[category.name]).toBeUndefined();
      expect(
        state.relationships.kindToCategories[category.kind],
      ).toBeUndefined();
      expect(
        state.relationships.categoryToImages[category.name],
      ).toBeUndefined();
      expect(
        state.relationships.categoryToAnnotations[category.kind],
      ).toBeUndefined();
      expect(consoleError).toHaveBeenCalledWith(
        "Cannot directly create unknown category.",
      );
      consoleError.mockRestore();
    });
    it("should add a category and update relationships", () => {
      const category = createMockCategory();
      store.dispatch(dataSlice.actions.addCategory(category));

      const state = getState().data;
      expect(state.categories.entities["cat1"]).toEqual(category);
      expect(state.relationships.kindToCategories["kind1"]).toContain("cat1");
      expect(state.relationships.categoryToImages["cat1"]).toEqual([]);
      expect(state.relationships.categoryToAnnotations["cat1"]).toEqual([]);
    });

    it("should update a category", () => {
      const category = createMockCategory();
      store.dispatch(dataSlice.actions.addCategory(category));

      store.dispatch(
        dataSlice.actions.updateCategory({
          id: "cat1",
          changes: { name: "Updated Category", color: "#00FF00" },
        }),
      );

      const state = getState().data;
      const updated = state.categories.entities["cat1"];
      expect(updated?.name).toBe("Updated Category");
      expect(updated?.color).toBe("#00FF00");
    });

    it("should not delete unknown category", () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      let state = getState().data;
      const unknownCategoryId = state.kinds.entities["kind1"].unknownCategoryId;
      expect(unknownCategoryId).toBeDefined();
      store.dispatch(dataSlice.actions.deleteCategory(unknownCategoryId));
      state = getState().data;
      expect(state.categories.entities[unknownCategoryId]).toBeDefined();
      expect(consoleError).toHaveBeenCalledWith(
        "Cannot remove unknown Category",
      );
      consoleError.mockRestore();
    });

    it("should delete a category", () => {
      const category = createMockCategory();
      store.dispatch(dataSlice.actions.addCategory(category));

      store.dispatch(dataSlice.actions.deleteCategory("cat1"));

      const state = getState().data;
      expect(state.categories.entities["cat1"]).toBeUndefined();
      expect(state.relationships.kindToCategories["kind1"]).not.toContain(
        "cat1",
      );
      expect(state.relationships.categoryToImages["cat1"]).toBeUndefined();
      expect(state.relationships.categoryToAnnotations["cat1"]).toBeUndefined();
    });

    it("should cascade delete category and reassign to unknown for images", () => {
      const category = createMockCategory({ id: "cat1", kind: IMAGE_KIND });

      const metadata = createMockImageMetadata();
      const image = createMockImageData({
        categoryId: "cat1",
        metadataId: "meta1",
      });

      store.dispatch(dataSlice.actions.addCategory(category));
      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [image] }),
      );

      store.dispatch(dataSlice.actions.deleteCategoryCascade("cat1"));
      const state = getState().data;
      const imageKind = state.kinds.entities[IMAGE_KIND];
      const unknownCategory =
        state.categories.entities[imageKind.unknownCategoryId];
      expect(state.categories.entities["cat1"]).toBeUndefined();
      expect(
        state.relationships.categoryToImages[unknownCategory.id],
      ).toContain("img1");
      expect(state.relationships.categoryToImages["cat1"]).toBeUndefined();
    });

    it("should cascade delete category and reassign to unknown for annotations", () => {
      const { kind: annotationKind, unknownCategory } = createMockKind({
        id: "annotation-kind",
      });

      const category = createMockCategory({
        id: "cat2",
        kind: "annotation-kind",
      });
      const annotation = createMockAnnotation({
        categoryId: "cat2",
        kind: "annotation-kind",
      });

      store.dispatch(
        dataSlice.actions.addKind({ kind: annotationKind, unknownCategory }),
      );
      store.dispatch(dataSlice.actions.addCategory(category));
      store.dispatch(dataSlice.actions.addAnnotation(annotation));

      store.dispatch(dataSlice.actions.deleteCategoryCascade("cat2"));

      const state = getState().data;
      expect(state.categories.entities["cat2"]).toBeUndefined();
      expect(
        state.relationships.categoryToAnnotations[unknownCategory.id],
      ).toContain("ann1");
      expect(state.relationships.categoryToAnnotations["cat2"]).toBeUndefined();
    });

    it("should batch add categories", () => {
      const categories = [
        createMockCategory({ id: "cat1" }),
        createMockCategory({ id: "cat2" }),
        createMockCategory({ id: "cat3" }),
      ];

      store.dispatch(dataSlice.actions.batchAddCategory(categories));

      const state = getState().data;
      expect(state.categories.entities["cat1"]).toBeDefined();
      expect(state.categories.entities["cat2"]).toBeDefined();
      expect(state.categories.entities["cat3"]).toBeDefined();
    });

    it("should batch delete categories with cascade", () => {
      const categories = [
        createMockCategory({ id: "cat1" }),
        createMockCategory({ id: "cat2" }),
        createMockCategory({ id: "cat3" }),
      ];

      store.dispatch(dataSlice.actions.batchAddCategory(categories));
      store.dispatch(
        dataSlice.actions.batchDeleteCategoryCascade(["cat1", "cat3"]),
      );

      const state = getState().data;
      expect(state.categories.entities["cat1"]).toBeUndefined();
      expect(state.categories.entities["cat2"]).toBeDefined();
      expect(state.categories.entities["cat3"]).toBeUndefined();
    });

    it("should batch delete categories by kind", () => {
      const { kind, unknownCategory } = createMockKind({
        id: "kind2",
      });

      const categories = [
        createMockCategory({ id: "cat1", kind: "kind2" }),
        createMockCategory({ id: "cat2", kind: "kind2" }),
      ];

      store.dispatch(dataSlice.actions.addKind({ kind, unknownCategory }));
      store.dispatch(dataSlice.actions.batchAddCategory(categories));

      store.dispatch(dataSlice.actions.batchDeleteCategoriesByKind("kind2"));

      const state = getState().data;
      // Regular categories should be deleted
      expect(state.categories.entities["cat1"]).toBeUndefined();
      expect(state.categories.entities["cat2"]).toBeUndefined();
      // Unknown category should remain
      expect(state.categories.entities[unknownCategory.id]).toBeDefined();
    });
  });

  describe("Metadata and Image Operations", () => {
    it("should add metadata with images", () => {
      const metadata = createMockImageMetadata();
      const image = createMockImageData();

      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [image] }),
      );

      const state = getState().data;
      expect(state.metadata.entities["meta1"]).toEqual(metadata);
      expect(state.images.entities["img1"]).toEqual(image);
      expect(state.relationships.imageToAnnotations["img1"]).toEqual([]);
      expect(state.relationships.categoryToImages["cat1"]).toContain("img1");
    });
    it("should batch add metadata", () => {
      const metadataGroup = [
        {
          metadata: createMockImageMetadata({
            id: "meta1",
            imageDataIds: ["img1"],
          }),
          images: [createMockImageData({ id: "img1", metadataId: "meta1" })],
        },
        {
          metadata: createMockImageMetadata({
            id: "meta2",
            imageDataIds: ["img2"],
          }),
          images: [createMockImageData({ id: "img2", metadataId: "meta2" })],
        },
      ];

      store.dispatch(dataSlice.actions.batchAddMetadata(metadataGroup));

      const state = getState().data;
      expect(state.metadata.entities["meta1"]).toBeDefined();
      expect(state.metadata.entities["meta2"]).toBeDefined();
      expect(state.images.entities["img1"]).toBeDefined();
      expect(state.images.entities["img2"]).toBeDefined();
    });

    it("should throw error when metadata and images count mismatch", () => {
      const metadata = createMockImageMetadata({
        imageDataIds: ["img1", "img2"],
      });
      const image = createMockImageData();

      expect(() => {
        store.dispatch(
          dataSlice.actions.addMetadata({ metadata, images: [image] }),
        );
      }).toThrow("Metadata specifies 2 images but store only supplied 1");
    });

    it("should throw error when metadata and image ids mismatch", () => {
      const metadata = createMockImageMetadata({ imageDataIds: ["img2"] });
      const image = createMockImageData({ id: "img1" });

      expect(() => {
        store.dispatch(
          dataSlice.actions.addMetadata({ metadata, images: [image] }),
        );
      }).toThrow(
        "Image Ids provided in metadata do not match Ids of images provided",
      );
    });

    it("should update default metadata image", () => {
      const metadata = createMockImageMetadata({
        imageDataIds: ["img1", "img2"],
        defaultImageId: "img1",
      });
      const image1 = createMockImageData({ id: "img1" });
      const image2 = createMockImageData({ id: "img2" });

      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [image1, image2] }),
      );
      store.dispatch(
        dataSlice.actions.updateDefaultMetadataImage({
          metadataId: "meta1",
          defaultImageId: "img2",
        }),
      );

      const state = getState().data;
      expect(state.metadata.entities["meta1"]?.defaultImageId).toBe("img2");
    });

    it("should log error when updating default image with invalid metadata id", () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      store.dispatch(
        dataSlice.actions.updateDefaultMetadataImage({
          metadataId: "invalid",
          defaultImageId: "img1",
        }),
      );

      expect(consoleError).toHaveBeenCalledWith(
        "No metadata with id: ",
        "invalid",
      );
      consoleError.mockRestore();
    });

    it("should add image data", () => {
      const image = createMockImageData();
      store.dispatch(dataSlice.actions.addImageData(image));

      const state = getState().data;
      expect(state.images.entities["img1"]).toEqual(image);
      expect(state.relationships.imageToAnnotations["img1"]).toEqual([]);
      expect(state.relationships.categoryToImages["cat1"]).toContain("img1");
    });

    it("should update image data", () => {
      const metadata = createMockImageMetadata();
      const image = createMockImageData();

      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [image] }),
      );
      store.dispatch(
        dataSlice.actions.updateImageData({
          id: "img1",
          changes: {
            categoryId: "cat2",
            partition: "validation" as Partition,
          },
        }),
      );

      const state = getState().data;
      const updated = state.images.entities["img1"];
      expect(updated?.categoryId).toBe("cat2");
      expect(updated?.partition).toBe("validation");
      expect(state.relationships.categoryToImages["cat1"]).not.toContain(
        "img1",
      );
      expect(state.relationships.categoryToImages["cat2"]).toContain("img1");
    });

    it("should delete image and update metadata", () => {
      const metadata = createMockImageMetadata({
        imageDataIds: ["img1", "img2"],
        defaultImageId: "img1",
      });
      const image1 = createMockImageData({ id: "img1" });
      const image2 = createMockImageData({ id: "img2" });

      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [image1, image2] }),
      );
      store.dispatch(dataSlice.actions.deleteImageData("img1"));

      const state = getState().data;
      expect(state.images.entities["img1"]).toBeUndefined();
      expect(state.metadata.entities["meta1"]?.imageDataIds).not.toContain(
        "img1",
      );
      expect(state.metadata.entities["meta1"]?.defaultImageId).toBe("img2");
    });

    it("should cascade delete image with annotations", () => {
      const metadata = createMockImageMetadata();
      const image = createMockImageData();
      const annotation1 = createMockAnnotation({ id: "ann1" });
      const annotation2 = createMockAnnotation({ id: "ann2" });

      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [image] }),
      );
      store.dispatch(dataSlice.actions.addAnnotation(annotation1));
      store.dispatch(dataSlice.actions.addAnnotation(annotation2));

      store.dispatch(dataSlice.actions.deleteImageCascade("img1"));

      const state = getState().data;
      expect(state.images.entities["img1"]).toBeUndefined();
      expect(state.annotations.entities["ann1"]).toBeUndefined();
      expect(state.annotations.entities["ann2"]).toBeUndefined();
      expect(state.relationships.imageToAnnotations["img1"]).toBeUndefined();
    });

    it("should batch update image data", () => {
      const metadata = createMockImageMetadata({
        imageDataIds: ["img1", "img2"],
      });
      const images = [
        createMockImageData({ id: "img1" }),
        createMockImageData({ id: "img2" }),
      ];

      store.dispatch(dataSlice.actions.addMetadata({ metadata, images }));

      const updates = [
        { id: "img1", changes: { partition: "validation" as Partition } },
        { id: "img2", changes: { categoryId: "cat2" } },
      ];

      store.dispatch(dataSlice.actions.batchUpdateImageData(updates));

      const state = getState().data;
      expect(state.images.entities["img1"]?.partition).toBe("validation");
      expect(state.images.entities["img2"]?.categoryId).toBe("cat2");
    });

    it("should batch delete images", () => {
      const metadata = createMockImageMetadata({
        imageDataIds: ["img1", "img2", "img3"],
      });
      const images = [
        createMockImageData({ id: "img1" }),
        createMockImageData({ id: "img2" }),
        createMockImageData({ id: "img3" }),
      ];

      store.dispatch(dataSlice.actions.addMetadata({ metadata, images }));
      store.dispatch(dataSlice.actions.batchDeleteImageData(["img1", "img3"]));

      const state = getState().data;
      expect(state.images.entities["img1"]).toBeUndefined();
      expect(state.images.entities["img2"]).toBeDefined();
      expect(state.images.entities["img3"]).toBeUndefined();
    });

    it("should batch cascade delete images", () => {
      const metadata = createMockImageMetadata({
        imageDataIds: ["img1", "img2"],
      });
      const images = [
        createMockImageData({ id: "img1" }),
        createMockImageData({ id: "img2" }),
      ];
      const ann1 = createMockAnnotation({ id: "ann1", imageId: "img1" });
      const ann2 = createMockAnnotation({ id: "ann2", imageId: "img2" });

      store.dispatch(dataSlice.actions.addMetadata({ metadata, images }));
      store.dispatch(dataSlice.actions.addAnnotation(ann1));
      store.dispatch(dataSlice.actions.addAnnotation(ann2));

      store.dispatch(
        dataSlice.actions.batchDeleteImageDataCascade(["img1", "img2"]),
      );

      const state = getState().data;
      expect(state.images.entities["img1"]).toBeUndefined();
      expect(state.images.entities["img2"]).toBeUndefined();
      expect(state.annotations.entities["ann1"]).toBeUndefined();
      expect(state.annotations.entities["ann2"]).toBeUndefined();
    });
    it("should delete metadata if all images deleted", () => {
      const metadata = createMockImageMetadata({
        imageDataIds: ["img1", "img2"],
      });
      const image1 = createMockImageData({ id: "img1" });
      const image2 = createMockImageData({ id: "img2" });

      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [image1, image2] }),
      );
      store.dispatch(dataSlice.actions.batchDeleteImageData(["img1", "img2"]));

      const state = getState().data;
      expect(state.metadata.entities["meta1"]).toBeUndefined();
      expect(state.images.entities["img1"]).toBeUndefined();
      expect(state.images.entities["img2"]).toBeUndefined();
    });
  });

  describe("Annotation Operations", () => {
    beforeEach(() => {
      const metadata = createMockImageMetadata();
      const image = createMockImageData();
      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [image] }),
      );
    });

    it("should add annotation with relationships", () => {
      const annotation = createMockAnnotation();
      store.dispatch(dataSlice.actions.addAnnotation(annotation));

      const state = getState().data;
      expect(state.annotations.entities["ann1"]).toEqual(annotation);
      expect(state.relationships.imageToAnnotations["img1"]).toContain("ann1");
      expect(state.relationships.categoryToAnnotations["cat1"]).toContain(
        "ann1",
      );
      expect(
        state.relationships.kindToAnnotations["annotation-kind"],
      ).toContain("ann1");
    });

    it("should update annotation relationships correctly", () => {
      const annotation = createMockAnnotation();
      const newCategory = createMockCategory({ id: "cat2" });

      store.dispatch(dataSlice.actions.addCategory(newCategory));
      store.dispatch(dataSlice.actions.addAnnotation(annotation));

      store.dispatch(
        dataSlice.actions.updateAnnotation({
          id: "ann1",
          changes: {
            categoryId: "cat2",
            name: "Updated Annotation",
          },
        }),
      );

      const state = getState().data;
      const updated = state.annotations.entities["ann1"];
      expect(updated?.categoryId).toBe("cat2");
      expect(updated?.name).toBe("Updated Annotation");
      expect(state.relationships.categoryToAnnotations["cat1"]).not.toContain(
        "ann1",
      );
      expect(state.relationships.categoryToAnnotations["cat2"]).toContain(
        "ann1",
      );
    });

    it("should update annotation kind correctly", () => {
      const annotation = createMockAnnotation();
      const newKind = createMockKind({ id: "new-kind" });

      store.dispatch(dataSlice.actions.addKind(newKind));
      store.dispatch(dataSlice.actions.addAnnotation(annotation));

      store.dispatch(
        dataSlice.actions.updateAnnotation({
          id: "ann1",
          changes: { kind: "new-kind" },
        }),
      );

      const state = getState().data;
      expect(state.annotations.entities["ann1"]?.kind).toBe("new-kind");
      expect(
        state.relationships.kindToAnnotations["annotation-kind"],
      ).not.toContain("ann1");
      expect(state.relationships.kindToAnnotations["new-kind"]).toContain(
        "ann1",
      );
    });

    it("should delete annotation and clean up relationships", () => {
      const annotation = createMockAnnotation();
      store.dispatch(dataSlice.actions.addAnnotation(annotation));

      store.dispatch(dataSlice.actions.deleteAnnotation("ann1"));

      const state = getState().data;
      expect(state.annotations.entities["ann1"]).toBeUndefined();
      expect(state.relationships.imageToAnnotations["img1"]).not.toContain(
        "ann1",
      );
      expect(state.relationships.categoryToAnnotations["cat1"]).not.toContain(
        "ann1",
      );
      expect(
        state.relationships.kindToAnnotations["annotation-kind"],
      ).not.toContain("ann1");
    });

    it("should batch add annotations", () => {
      const annotations = [
        createMockAnnotation({ id: "ann1" }),
        createMockAnnotation({ id: "ann2" }),
        createMockAnnotation({ id: "ann3" }),
      ];

      store.dispatch(dataSlice.actions.batchAddAnnotations(annotations));

      const state = getState().data;
      expect(state.annotations.entities["ann1"]).toBeDefined();
      expect(state.annotations.entities["ann2"]).toBeDefined();
      expect(state.annotations.entities["ann3"]).toBeDefined();
      expect(state.relationships.imageToAnnotations["img1"]).toEqual([
        "ann1",
        "ann2",
        "ann3",
      ]);
    });

    it("should batch update annotations", () => {
      const annotations = [
        createMockAnnotation({ id: "ann1" }),
        createMockAnnotation({ id: "ann2" }),
      ];

      store.dispatch(dataSlice.actions.batchAddAnnotations(annotations));

      const updates = [
        { id: "ann1", changes: { name: "Updated 1" } },
        { id: "ann2", changes: { name: "Updated 2" } },
      ];

      store.dispatch(dataSlice.actions.batchUpdateAnnotation(updates));

      const state = getState().data;
      expect(state.annotations.entities["ann1"]?.name).toBe("Updated 1");
      expect(state.annotations.entities["ann2"]?.name).toBe("Updated 2");
    });

    it("should batch delete annotations", () => {
      const annotations = [
        createMockAnnotation({ id: "ann1" }),
        createMockAnnotation({ id: "ann2" }),
        createMockAnnotation({ id: "ann3" }),
      ];

      store.dispatch(dataSlice.actions.batchAddAnnotations(annotations));
      store.dispatch(
        dataSlice.actions.batchDeleteAnnotations(["ann1", "ann3"]),
      );

      const state = getState().data;
      expect(state.annotations.entities["ann1"]).toBeUndefined();
      expect(state.annotations.entities["ann2"]).toBeDefined();
      expect(state.annotations.entities["ann3"]).toBeUndefined();
      expect(state.relationships.imageToAnnotations["img1"]).toEqual(["ann2"]);
    });

    it("should delete annotations of category", () => {
      const category = createMockCategory({ id: "cat2" });
      const annotations = [
        createMockAnnotation({ id: "ann1", categoryId: "cat1" }),
        createMockAnnotation({ id: "ann2", categoryId: "cat2" }),
        createMockAnnotation({ id: "ann3", categoryId: "cat2" }),
      ];

      store.dispatch(dataSlice.actions.addCategory(category));
      store.dispatch(dataSlice.actions.batchAddAnnotations(annotations));
      store.dispatch(dataSlice.actions.deleteAnnotationsOfCategory("cat2"));

      const state = getState().data;
      expect(state.annotations.entities["ann1"]).toBeDefined();
      expect(state.annotations.entities["ann2"]).toBeUndefined();
      expect(state.annotations.entities["ann3"]).toBeUndefined();
      expect(state.relationships.categoryToAnnotations["cat2"]).toEqual([]);
    });

    it("should handle deletion with link graph cleanup", () => {
      const ann1 = createMockAnnotation({ id: "ann1" });
      const parent1 = createMockAnnotation({ id: "parent1" });
      const child1 = createMockAnnotation({ id: "child1" });

      // Add annotation with link graph entry
      store.dispatch(
        dataSlice.actions.batchAddAnnotations([ann1, parent1, child1]),
      );

      store.dispatch(
        dataSlice.actions.addTracklet({
          metadataId: "metaId",
          trackId: "global1",
          color: "",
          linkedIds: ["ann1", "parent1", "child1"],
        }),
      );
      store.dispatch(dataSlice.actions.deleteAnnotation("ann1"));

      const state = getState().data;
      expect(state.annotations.entities["ann1"]).toBeUndefined();
      expect(state.tracklets["global1"]?.linkedIds).not.toContain("ann1");
    });
  });

  describe("Utility Operations", () => {
    it("should clear all data", () => {
      const kind = createMockKind();
      const category = createMockCategory();
      const metadata = createMockImageMetadata();
      const image = createMockImageData();
      const annotation = createMockAnnotation();

      store.dispatch(dataSlice.actions.addKind(kind));
      store.dispatch(dataSlice.actions.addCategory(category));
      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [image] }),
      );
      store.dispatch(dataSlice.actions.addAnnotation(annotation));

      store.dispatch(dataSlice.actions.clearAll());

      const state = getState();

      const allKinds = selectAllKinds(state);
      const allCategories = selectAllCategories(state);
      const allMetadata = selectAllMetadata(state);
      const allImages = selectAllImageData(state);
      const allAnnotations = selectAllAnnotations(state);

      expect(allKinds).toHaveLength(1); // IMAGE_KIND
      expect(allKinds[0].id).toBe(IMAGE_KIND);
      expect(allCategories).toHaveLength(1); // Unknown image category
      expect(allCategories[0].name).toBe("Unknown");
      expect(allMetadata).toHaveLength(0);
      expect(allImages).toHaveLength(0);
      expect(allAnnotations).toHaveLength(0);

      const dataState = state.data;
      expect(
        Object.keys(dataState.relationships.kindToCategories),
      ).toHaveLength(1);
      expect(Object.keys(dataState.tracklets)).toHaveLength(0);
    });
  });

  describe("Complex Relationship Scenarios", () => {
    it("should maintain consistency when deleting annotation with complex relationships", () => {
      const kind = createMockKind({ id: "kind1" });
      const category = createMockCategory({ id: "cat1" });
      const metadata = createMockImageMetadata();
      const image = createMockImageData();
      const annotation = createMockAnnotation({
        kind: "kind1",
        categoryId: "cat1",
        imageId: "img1",
      });

      store.dispatch(dataSlice.actions.addKind(kind));
      store.dispatch(dataSlice.actions.addCategory(category));
      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [image] }),
      );
      store.dispatch(dataSlice.actions.addAnnotation(annotation));

      // Verify relationships are set up
      let state = getState().data;
      expect(state.relationships.kindToAnnotations["kind1"]).toContain("ann1");
      expect(state.relationships.categoryToAnnotations["cat1"]).toContain(
        "ann1",
      );
      expect(state.relationships.imageToAnnotations["img1"]).toContain("ann1");

      store.dispatch(dataSlice.actions.deleteAnnotation("ann1"));

      // Verify all relationships are cleaned up
      state = getState().data;
      expect(state.relationships.kindToAnnotations["kind1"]).not.toContain(
        "ann1",
      );
      expect(state.relationships.categoryToAnnotations["cat1"]).not.toContain(
        "ann1",
      );
      expect(state.relationships.imageToAnnotations["img1"]).not.toContain(
        "ann1",
      );
    });

    it("should handle cascade operations with multiple entity types", () => {
      // Create a complex scenario with multiple relationships
      const { kind: imageKind, unknownCategory: unknownImgCat } =
        createMockKind({
          id: IMAGE_KIND,
        });
      const { kind: annotationKind, unknownCategory: unknownAnnCat } =
        createMockKind({
          id: "Annotation",
        });

      const imgCat = createMockCategory({ id: "img-cat", kind: IMAGE_KIND });
      const annCat = createMockCategory({ id: "ann-cat", kind: "Annotation" });

      const metadata = createMockImageMetadata({
        imageDataIds: ["img1", "img2"],
      });
      const img1 = createMockImageData({ id: "img1", categoryId: "img-cat" });
      const img2 = createMockImageData({ id: "img2", categoryId: "img-cat" });

      const ann1 = createMockAnnotation({
        id: "ann1",
        imageId: "img1",
        categoryId: "ann-cat",
        kind: "Annotation",
      });
      const ann2 = createMockAnnotation({
        id: "ann2",
        imageId: "img1",
        categoryId: "ann-cat",
        kind: "Annotation",
      });
      const ann3 = createMockAnnotation({
        id: "ann3",
        imageId: "img2",
        categoryId: "ann-cat",
        kind: "Annotation",
      });

      // Set up the complex structure
      store.dispatch(
        dataSlice.actions.addKind({
          kind: imageKind,
          unknownCategory: unknownImgCat,
        }),
      );
      store.dispatch(
        dataSlice.actions.addKind({
          kind: annotationKind,
          unknownCategory: unknownAnnCat,
        }),
      );
      store.dispatch(dataSlice.actions.addCategory(unknownImgCat));
      store.dispatch(dataSlice.actions.addCategory(unknownAnnCat));
      store.dispatch(dataSlice.actions.addCategory(imgCat));
      store.dispatch(dataSlice.actions.addCategory(annCat));
      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [img1, img2] }),
      );
      store.dispatch(dataSlice.actions.batchAddAnnotations([ann1, ann2, ann3]));

      // Delete annotation kind cascade
      store.dispatch(dataSlice.actions.deleteKindCascade("Annotation"));

      const state = getState().data;

      // Annotation kind and its categories should be gone (except unknown)
      expect(state.kinds.entities["Annotation"]).toBeUndefined();
      expect(state.categories.entities["ann-cat"]).toBeUndefined();

      // Annotations should be gone
      expect(state.annotations.entities["ann1"]).toBeUndefined();
      expect(state.annotations.entities["ann2"]).toBeUndefined();
      expect(state.annotations.entities["ann3"]).toBeUndefined();

      // Images should still exist
      expect(state.images.entities["img1"]).toBeDefined();
      expect(state.images.entities["img2"]).toBeDefined();

      // Image relationships should be cleaned up
      expect(state.relationships.imageToAnnotations["img1"]).toEqual([]);
      expect(state.relationships.imageToAnnotations["img2"]).toEqual([]);
    });

    it("should properly update default image when deleting images", () => {
      const metadata = createMockImageMetadata({
        imageDataIds: ["img1", "img2", "img3"],
        defaultImageId: "img2",
      });

      const images = [
        createMockImageData({ id: "img1", metadataId: "meta1" }),
        createMockImageData({ id: "img2", metadataId: "meta1" }),
        createMockImageData({ id: "img3", metadataId: "meta1" }),
      ];

      store.dispatch(dataSlice.actions.addMetadata({ metadata, images }));

      // Delete the default image
      store.dispatch(dataSlice.actions.deleteImageData("img2"));

      let state = getState().data;
      // Should update to first available image
      expect(state.metadata.entities["meta1"]?.defaultImageId).toBe("img1");

      // Delete img1
      store.dispatch(dataSlice.actions.deleteImageData("img1"));

      state = getState().data;
      // Should update to the last remaining image
      expect(state.metadata.entities["meta1"]?.defaultImageId).toBe("img3");
    });
  });

  describe("Error Handling", () => {
    it("should handle operations on non-existent entities gracefully", () => {
      // Try to update non-existent kind
      store.dispatch(
        dataSlice.actions.updateKindName({
          id: "non-existent",
          newName: "New Name",
        }),
      );

      // Try to update non-existent category
      store.dispatch(
        dataSlice.actions.updateCategory({
          id: "non-existent",
          changes: { name: "New Name" },
        }),
      );

      // Try to update non-existent image
      store.dispatch(
        dataSlice.actions.updateImageData({
          id: "non-existent",
          changes: { categoryId: "cat1" },
        }),
      );

      // Try to update non-existent annotation
      store.dispatch(
        dataSlice.actions.updateAnnotation({
          id: "non-existent",
          changes: { name: "New Name" },
        }),
      );

      // None of these should throw or cause issues
      const state = getState().data;
      expect(state).toBeDefined();
    });

    it("should handle deletion of non-existent entities gracefully", () => {
      // Try to delete non-existent entities
      store.dispatch(dataSlice.actions.deleteKind("non-existent"));
      store.dispatch(dataSlice.actions.deleteCategory("non-existent"));
      store.dispatch(dataSlice.actions.deleteImageData("non-existent"));
      store.dispatch(dataSlice.actions.deleteAnnotation("non-existent"));

      // None of these should throw
      const state = getState().data;
      expect(state).toBeDefined();
    });
  });
});
