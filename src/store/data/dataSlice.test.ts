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
  selectAllKinds,
  selectAllTracklets,
  kindSelectors,
} from "./selectors";
import {
  Kind,
  Category,
  ImageMetadata,
  ImageObject,
  AnnotationObject,
  Tracklet,
} from "./types";
import { Partition } from "utils/models/enums";
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

const createMockImageData = (
  overrides: Partial<ImageObject> = {},
): ImageObject => ({
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

const createMockAnnotation = (
  overrides: Partial<AnnotationObject> = {},
): AnnotationObject => ({
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

const createMockTracklet = (overrides: Partial<Tracklet> = {}): Tracklet => ({
  id: "tracklet1",
  metadataId: "meta1",
  color: "#FF0000",
  start: 0,
  end: 2,
  linkedIds: [],
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
  const getUnknownImageCategoryId = () =>
    getState().data.kinds.entities[IMAGE_KIND].unknownCategoryId;

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
      store.dispatch(dataSlice.actions.deleteKind("Images"));

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
      store.dispatch(dataSlice.actions.deleteKind("kind1"));

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
      const imageCategory = createMockCategory({
        id: "imCat",
        kind: IMAGE_KIND,
      });
      store.dispatch(dataSlice.actions.addCategory(category));
      store.dispatch(dataSlice.actions.addCategory(imageCategory));
      const state = getState().data;
      expect(state.categories.entities["cat1"]).toEqual(category);
      expect(state.relationships.kindToCategories["kind1"]).toContain("cat1");
      expect(state.relationships.categoryToAnnotations["cat1"]).toEqual([]);
      expect(state.categories.entities["imCat"]).toEqual(imageCategory);
      expect(state.relationships.kindToCategories[IMAGE_KIND]).toContain(
        "imCat",
      );
      expect(state.relationships.categoryToImages["imCat"]).toEqual([]);
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
      const kind = createMockKind();
      store.dispatch(dataSlice.actions.addKind(kind));
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

      store.dispatch(dataSlice.actions.deleteCategory("cat1"));
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

      store.dispatch(dataSlice.actions.deleteCategory("cat2"));

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
      const unknownImageCategoryId = getUnknownImageCategoryId();
      const metadata = createMockImageMetadata();
      const image = createMockImageData({
        categoryId: unknownImageCategoryId,
      });

      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [image] }),
      );

      const state = getState().data;
      expect(state.metadata.entities["meta1"]).toEqual(metadata);
      expect(state.images.entities["img1"]).toEqual(image);
      expect(state.relationships.imageToAnnotations["img1"]).toEqual([]);
      expect(
        state.relationships.categoryToImages[unknownImageCategoryId],
      ).toContain("img1");
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
      const unknowImageCategoryId = getUnknownImageCategoryId();
      const image = createMockImageData({ categoryId: unknowImageCategoryId });
      store.dispatch(dataSlice.actions.addImageData(image));

      const state = getState().data;
      expect(state.images.entities["img1"]).toEqual(image);
      expect(state.relationships.imageToAnnotations["img1"]).toEqual([]);
      expect(
        state.relationships.categoryToImages[unknowImageCategoryId],
      ).toContain("img1");
    });

    it("should update image data", () => {
      const metadata = createMockImageMetadata();
      const unknownImageCategoryId = getUnknownImageCategoryId();
      const image = createMockImageData({ categoryId: unknownImageCategoryId });
      const category1 = createMockCategory();

      store.dispatch(
        dataSlice.actions.addMetadata({ metadata, images: [image] }),
      );
      store.dispatch(dataSlice.actions.addCategory(category1));
      store.dispatch(
        dataSlice.actions.updateImageData({
          id: "img1",
          changes: {
            categoryId: "cat1",
            partition: "validation" as Partition,
          },
        }),
      );

      const state = getState().data;
      const updated = state.images.entities["img1"];
      expect(updated?.categoryId).toBe("cat1");
      expect(updated?.partition).toBe("validation");
      expect(
        state.relationships.categoryToImages[unknownImageCategoryId],
      ).not.toContain("img1");
      expect(state.relationships.categoryToImages["cat1"]).toContain("img1");
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

      store.dispatch(dataSlice.actions.deleteImageData("img1"));

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

      store.dispatch(dataSlice.actions.batchDeleteImageData(["img1", "img2"]));

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
      const image = createMockImageData();
      const category = createMockCategory();
      const kind = createMockKind({ id: "annotation-kind" });
      store.dispatch(dataSlice.actions.addKind(kind));
      store.dispatch(dataSlice.actions.addImageData(image));
      store.dispatch(dataSlice.actions.addCategory(category));
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
      const category1 = createMockCategory();
      const newCategory = createMockCategory({ id: "cat2" });
      store.dispatch(dataSlice.actions.addCategory(category1));
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
      const kind = createMockKind({ id: "annotation-kind" });
      store.dispatch(dataSlice.actions.addKind(kind));
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
      const image = createMockImageData();
      const category = createMockCategory();
      const kind = createMockKind({ id: "annotation-kind" });
      store.dispatch(dataSlice.actions.addKind(kind));
      store.dispatch(dataSlice.actions.addImageData(image));
      store.dispatch(dataSlice.actions.addCategory(category));
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

      store.dispatch(dataSlice.actions.batchUpdateAnnotations(updates));

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
      const ann1 = createMockAnnotation({ id: "ann1", timepoint: 0 });
      const parent1 = createMockAnnotation({ id: "parent1", timepoint: 1 });
      const child1 = createMockAnnotation({ id: "child1", timepoint: 2 });

      // Add annotation with link graph entry
      store.dispatch(
        dataSlice.actions.batchAddAnnotations([ann1, parent1, child1]),
      );

      store.dispatch(
        dataSlice.actions.addTracklet({
          metadataId: "metaId",
          id: "global1",
          start: 0,
          end: 2,
          color: "",
          linkedIds: ["ann1", "parent1", "child1"],
        }),
      );
      store.dispatch(dataSlice.actions.deleteAnnotation("ann1"));

      const state = getState().data;
      expect(state.annotations.entities["ann1"]).toBeUndefined();
      expect(state.tracklets.entities["global1"]?.linkedIds).not.toContain(
        "ann1",
      );
    });
  });

  describe("Tracklet Operations", () => {
    beforeEach(() => {
      // Create annotation kind
      const { kind: annotationKind, unknownCategory } = createMockKind({
        id: "annotation-kind",
      });
      store.dispatch(
        dataSlice.actions.addKind({ kind: annotationKind, unknownCategory }),
      );

      // Create time-series metadata with multiple timepoint images
      const metadata = createMockImageMetadata({
        id: "meta1",
        timeSeries: true,
        imageDataIds: ["img0", "img1", "img2", "img3", "img4"],
        defaultImageId: "img0",
      });
      const images = [
        createMockImageData({
          id: "img0",
          timepoint: 0,
          metadataId: "meta1",
        }),
        createMockImageData({
          id: "img1",
          timepoint: 1,
          metadataId: "meta1",
        }),
        createMockImageData({
          id: "img2",
          timepoint: 2,
          metadataId: "meta1",
        }),
        createMockImageData({
          id: "img3",
          timepoint: 3,
          metadataId: "meta1",
        }),
        createMockImageData({
          id: "img4",
          timepoint: 4,
          metadataId: "meta1",
        }),
      ];
      store.dispatch(dataSlice.actions.addMetadata({ metadata, images }));
    });

    describe("Basic CRUD", () => {
      it("should add a tracklet", () => {
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        store.dispatch(dataSlice.actions.batchAddAnnotations([ann1, ann2]));

        const tracklet = createMockTracklet({
          id: "track1",
          metadataId: "meta1",
          linkedIds: ["ann1", "ann2"],
          start: 0,
          end: 1,
        });

        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        const state = getState().data;
        expect(state.tracklets.entities["track1"]).toEqual(tracklet);
        expect(state.relationships.metadataToTracklets["meta1"]).toContain(
          "track1",
        );
        expect(state.annotations.entities["ann1"]?.trackId).toBe("track1");
        expect(state.annotations.entities["ann2"]?.trackId).toBe("track1");
      });

      it("should update tracklet color", () => {
        const tracklet = createMockTracklet({
          color: "#FF0000",
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        store.dispatch(
          dataSlice.actions.updateTrackletColor({
            id: "tracklet1",
            color: "#00FF00",
          }),
        );

        const state = getState().data;
        expect(state.tracklets.entities["tracklet1"]?.color).toBe("#00FF00");
      });

      it("should delete a tracklet", () => {
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        store.dispatch(dataSlice.actions.batchAddAnnotations([ann1, ann2]));

        const tracklet = createMockTracklet({
          id: "track1",
          linkedIds: ["ann1", "ann2"],
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        store.dispatch(dataSlice.actions.deleteTracklet("track1"));

        const state = getState().data;
        expect(state.tracklets.entities["track1"]).toBeUndefined();
        expect(state.annotations.entities["ann1"]?.trackId).toBeUndefined();
        expect(state.annotations.entities["ann2"]?.trackId).toBeUndefined();
        expect(state.relationships.metadataToTracklets["meta1"]).not.toContain(
          "track1",
        );
      });

      it("should delete tracklet with parent/child relationships", () => {
        const parent = createMockTracklet({
          id: "parent1",
          start: 0,
          end: 1,
        });
        const child = createMockTracklet({
          id: "child1",
          start: 2,
          end: 3,
        });
        const middle = createMockTracklet({
          id: "middle1",
          start: 1,
          end: 2,
        });

        store.dispatch(dataSlice.actions.addTracklet(parent));
        store.dispatch(dataSlice.actions.addTracklet(middle));
        store.dispatch(dataSlice.actions.addTracklet(child));

        store.dispatch(
          dataSlice.actions.addChildrenToTracklet({
            parentId: "parent1",
            childIds: ["middle1"],
          }),
        );
        store.dispatch(
          dataSlice.actions.addChildrenToTracklet({
            parentId: "middle1",
            childIds: ["child1"],
          }),
        );

        store.dispatch(dataSlice.actions.deleteTracklet("middle1"));

        const state = getState().data;
        expect(state.tracklets.entities["middle1"]).toBeUndefined();
        expect(state.tracklets.entities["parent1"]?.children).not.toContain(
          "middle1",
        );
        expect(state.tracklets.entities["child1"]?.parents).not.toContain(
          "middle1",
        );
      });

      it("should handle deletion of non-existent tracklet gracefully", () => {
        const consoleError = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        store.dispatch(dataSlice.actions.deleteTracklet("non-existent"));

        const state = getState().data;
        expect(state).toBeDefined();
        expect(consoleError).toHaveBeenCalledWith(
          'Tracklet with id "non-existent" does not exist',
        );

        consoleError.mockRestore();
      });
    });

    describe("Annotation Linking", () => {
      it("should add annotation to tracklet", () => {
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        const ann3 = createMockAnnotation({
          id: "ann3",
          imageId: "img2",
          timepoint: 2,
          kind: "annotation-kind",
        });
        store.dispatch(
          dataSlice.actions.batchAddAnnotations([ann1, ann2, ann3]),
        );

        const tracklet = createMockTracklet({
          id: "track1",
          linkedIds: ["ann1", "ann2"],
          start: 0,
          end: 1,
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        store.dispatch(
          dataSlice.actions.addAnnotationToTracklet({
            trackId: "track1",
            annId: "ann3",
          }),
        );

        const state = getState().data;
        const updatedTracklet = state.tracklets.entities["track1"];
        expect(updatedTracklet?.linkedIds).toContain("ann3");
        expect(updatedTracklet?.start).toBe(0);
        expect(updatedTracklet?.end).toBe(2);
        expect(state.annotations.entities["ann3"]?.trackId).toBe("track1");
      });

      it("should not add annotation at duplicate timepoint", () => {
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        store.dispatch(dataSlice.actions.batchAddAnnotations([ann1, ann2]));

        const tracklet = createMockTracklet({
          id: "track1",
          linkedIds: ["ann1"],
          start: 1,
          end: 1,
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        store.dispatch(
          dataSlice.actions.addAnnotationToTracklet({
            trackId: "track1",
            annId: "ann2",
          }),
        );

        const state = getState().data;
        expect(state.tracklets.entities["track1"]?.linkedIds).toHaveLength(1);
        expect(state.tracklets.entities["track1"]?.linkedIds).not.toContain(
          "ann2",
        );
      });

      it("should not add annotation already in tracklet", () => {
        const consoleError = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        store.dispatch(dataSlice.actions.addAnnotation(ann1));

        const tracklet = createMockTracklet({
          id: "track1",
          linkedIds: ["ann1"],
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        store.dispatch(
          dataSlice.actions.addAnnotationToTracklet({
            trackId: "track1",
            annId: "ann1",
          }),
        );

        const state = getState().data;
        expect(state.tracklets.entities["track1"]?.linkedIds).toHaveLength(1);
        expect(consoleError).toHaveBeenCalledWith(
          'Annotation with id "ann1" already part of track',
        );

        consoleError.mockRestore();
      });

      it("should remove annotation from tracklet", () => {
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        const ann3 = createMockAnnotation({
          id: "ann3",
          imageId: "img2",
          timepoint: 2,
          kind: "annotation-kind",
        });
        store.dispatch(
          dataSlice.actions.batchAddAnnotations([ann1, ann2, ann3]),
        );

        const tracklet = createMockTracklet({
          id: "track1",
          linkedIds: ["ann1", "ann2", "ann3"],
          start: 0,
          end: 2,
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        store.dispatch(
          dataSlice.actions.removeAnnotationFromTracklet({
            trackId: "track1",
            annId: "ann2",
          }),
        );

        const state = getState().data;
        const updatedTracklet = state.tracklets.entities["track1"];
        expect(updatedTracklet?.linkedIds).not.toContain("ann2");
        expect(updatedTracklet?.linkedIds).toHaveLength(2);
        expect(updatedTracklet?.start).toBe(0);
        expect(updatedTracklet?.end).toBe(2);
        expect(state.annotations.entities["ann2"]?.trackId).toBeUndefined();
      });

      it("should delete tracklet when removing last annotation", () => {
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        store.dispatch(dataSlice.actions.addAnnotation(ann1));

        const tracklet = createMockTracklet({
          id: "track1",
          linkedIds: ["ann1"],
          start: 0,
          end: 0,
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        store.dispatch(
          dataSlice.actions.removeAnnotationFromTracklet({
            trackId: "track1",
            annId: "ann1",
          }),
        );

        const state = getState().data;
        expect(state.tracklets.entities["track1"]).toBeUndefined();
        expect(state.annotations.entities["ann1"]?.trackId).toBeUndefined();
      });

      it("should recalculate boundaries when annotation extends beyond old range", () => {
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img2",
          timepoint: 2,
          kind: "annotation-kind",
        });
        const ann3 = createMockAnnotation({
          id: "ann3",
          imageId: "img3",
          timepoint: 3,
          kind: "annotation-kind",
        });
        store.dispatch(
          dataSlice.actions.batchAddAnnotations([ann1, ann2, ann3]),
        );

        // Create tracklet with narrower initial range than actual annotations
        const tracklet = createMockTracklet({
          id: "track1",
          linkedIds: ["ann1", "ann2", "ann3"],
          start: 1,
          end: 2,
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        // Remove ann1 (at start boundary)
        store.dispatch(
          dataSlice.actions.removeAnnotationFromTracklet({
            trackId: "track1",
            annId: "ann1",
          }),
        );

        const state = getState().data;
        // After removing ann1, only ann2 and ann3 remain
        // End should be recalculated to 3 because ann3.timepoint (3) > old end (2)
        expect(state.tracklets.entities["track1"]?.linkedIds).toHaveLength(2);
        expect(state.tracklets.entities["track1"]?.linkedIds).toContain("ann2");
        expect(state.tracklets.entities["track1"]?.linkedIds).toContain("ann3");
        expect(state.tracklets.entities["track1"]?.start).toBe(1);
        expect(state.tracklets.entities["track1"]?.end).toBe(3);
      });

      it("should recalculate boundaries when annotation extends before old range", () => {
        const ann0 = createMockAnnotation({
          id: "ann0",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img2",
          timepoint: 2,
          kind: "annotation-kind",
        });
        store.dispatch(
          dataSlice.actions.batchAddAnnotations([ann0, ann1, ann2]),
        );

        // Create tracklet with narrower initial range than actual annotations
        const tracklet = createMockTracklet({
          id: "track1",
          linkedIds: ["ann0", "ann1", "ann2"],
          start: 1,
          end: 2,
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        // Remove ann2 (at end boundary)
        store.dispatch(
          dataSlice.actions.removeAnnotationFromTracklet({
            trackId: "track1",
            annId: "ann2",
          }),
        );

        const state = getState().data;
        // After removing ann2, only ann0 and ann1 remain
        // Start should be recalculated to 0 because ann0.timepoint (0) < old start (1)
        expect(state.tracklets.entities["track1"]?.linkedIds).toHaveLength(2);
        expect(state.tracklets.entities["track1"]?.linkedIds).toContain("ann0");
        expect(state.tracklets.entities["track1"]?.linkedIds).toContain("ann1");
        expect(state.tracklets.entities["track1"]?.start).toBe(0);
        expect(state.tracklets.entities["track1"]?.end).toBe(2);
      });
    });

    describe("Parent/Child Relationships", () => {
      it("should add children to tracklet", () => {
        const parent = createMockTracklet({ id: "parent1" });
        const child1 = createMockTracklet({ id: "child1" });
        const child2 = createMockTracklet({ id: "child2" });

        store.dispatch(dataSlice.actions.addTracklet(parent));
        store.dispatch(dataSlice.actions.addTracklet(child1));
        store.dispatch(dataSlice.actions.addTracklet(child2));

        store.dispatch(
          dataSlice.actions.addChildrenToTracklet({
            parentId: "parent1",
            childIds: ["child1", "child2"],
          }),
        );

        const state = getState().data;
        expect(state.tracklets.entities["parent1"]?.children).toContain(
          "child1",
        );
        expect(state.tracklets.entities["parent1"]?.children).toContain(
          "child2",
        );
        expect(state.tracklets.entities["child1"]?.parents).toContain(
          "parent1",
        );
        expect(state.tracklets.entities["child2"]?.parents).toContain(
          "parent1",
        );
      });

      it("should add single child to tracklet", () => {
        const parent = createMockTracklet({ id: "parent1" });
        const child = createMockTracklet({ id: "child1" });

        store.dispatch(dataSlice.actions.addTracklet(parent));
        store.dispatch(dataSlice.actions.addTracklet(child));

        store.dispatch(
          dataSlice.actions.addChildrenToTracklet({
            parentId: "parent1",
            childIds: "child1",
          }),
        );

        const state = getState().data;
        expect(state.tracklets.entities["parent1"]?.children).toContain(
          "child1",
        );
        expect(state.tracklets.entities["child1"]?.parents).toContain(
          "parent1",
        );
      });

      it("should remove children from tracklet", () => {
        const parent = createMockTracklet({
          id: "parent1",
          children: ["child1", "child2", "child3"],
        });
        const child1 = createMockTracklet({
          id: "child1",
          parents: ["parent1"],
        });
        const child2 = createMockTracklet({
          id: "child2",
          parents: ["parent1"],
        });
        const child3 = createMockTracklet({
          id: "child3",
          parents: ["parent1"],
        });

        store.dispatch(dataSlice.actions.addTracklet(parent));
        store.dispatch(dataSlice.actions.addTracklet(child1));
        store.dispatch(dataSlice.actions.addTracklet(child2));
        store.dispatch(dataSlice.actions.addTracklet(child3));

        store.dispatch(
          dataSlice.actions.removeChildrenFromTracklet({
            parentId: "parent1",
            childIds: ["child1", "child2"],
          }),
        );

        const state = getState().data;
        expect(state.tracklets.entities["parent1"]?.children).not.toContain(
          "child1",
        );
        expect(state.tracklets.entities["parent1"]?.children).not.toContain(
          "child2",
        );
        expect(state.tracklets.entities["parent1"]?.children).toContain(
          "child3",
        );
        expect(state.tracklets.entities["child1"]?.parents).not.toContain(
          "parent1",
        );
        expect(state.tracklets.entities["child2"]?.parents).not.toContain(
          "parent1",
        );
      });

      it("should add parents to tracklet", () => {
        const parent1 = createMockTracklet({ id: "parent1" });
        const parent2 = createMockTracklet({ id: "parent2" });
        const child = createMockTracklet({ id: "child1" });

        store.dispatch(dataSlice.actions.addTracklet(parent1));
        store.dispatch(dataSlice.actions.addTracklet(parent2));
        store.dispatch(dataSlice.actions.addTracklet(child));

        store.dispatch(
          dataSlice.actions.addParentsToTracklet({
            childId: "child1",
            parentIds: ["parent1", "parent2"],
          }),
        );

        const state = getState().data;
        expect(state.tracklets.entities["child1"]?.parents).toContain(
          "parent1",
        );
        expect(state.tracklets.entities["child1"]?.parents).toContain(
          "parent2",
        );
        expect(state.tracklets.entities["parent1"]?.children).toContain(
          "child1",
        );
        expect(state.tracklets.entities["parent2"]?.children).toContain(
          "child1",
        );
      });

      it("should remove parents from tracklet", () => {
        const parent1 = createMockTracklet({
          id: "parent1",
          children: ["child1"],
        });
        const parent2 = createMockTracklet({
          id: "parent2",
          children: ["child1"],
        });
        const parent3 = createMockTracklet({
          id: "parent3",
          children: ["child1"],
        });
        const child = createMockTracklet({
          id: "child1",
          parents: ["parent1", "parent2", "parent3"],
        });

        store.dispatch(dataSlice.actions.addTracklet(parent1));
        store.dispatch(dataSlice.actions.addTracklet(parent2));
        store.dispatch(dataSlice.actions.addTracklet(parent3));
        store.dispatch(dataSlice.actions.addTracklet(child));

        store.dispatch(
          dataSlice.actions.removeParentsFromTracklet({
            childId: "child1",
            parentIds: ["parent1", "parent2"],
          }),
        );

        const state = getState().data;
        expect(state.tracklets.entities["child1"]?.parents).not.toContain(
          "parent1",
        );
        expect(state.tracklets.entities["child1"]?.parents).not.toContain(
          "parent2",
        );
        expect(state.tracklets.entities["child1"]?.parents).toContain(
          "parent3",
        );
        expect(state.tracklets.entities["parent1"]?.children).not.toContain(
          "child1",
        );
        expect(state.tracklets.entities["parent2"]?.children).not.toContain(
          "child1",
        );
      });
    });

    describe("Complex Operations", () => {
      it("should join tracklets into single tracklet", () => {
        const ann0 = createMockAnnotation({
          id: "ann0",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img2",
          timepoint: 2,
          kind: "annotation-kind",
        });
        const ann3 = createMockAnnotation({
          id: "ann3",
          imageId: "img3",
          timepoint: 3,
          kind: "annotation-kind",
        });
        store.dispatch(
          dataSlice.actions.batchAddAnnotations([ann0, ann1, ann2, ann3]),
        );

        const trackletA = createMockTracklet({
          id: "trackA",
          linkedIds: ["ann0"],
          start: 0,
          end: 0,
        });
        const trackletB = createMockTracklet({
          id: "trackB",
          linkedIds: ["ann1", "ann2"],
          start: 1,
          end: 2,
        });

        store.dispatch(dataSlice.actions.addTracklet(trackletA));
        store.dispatch(dataSlice.actions.addTracklet(trackletB));

        const initialState = getState().data;
        const initialTrackletIds = Object.keys(initialState.tracklets.entities);

        store.dispatch(
          dataSlice.actions.joinTracklets({
            primaryTracklet: "trackA",
            joinedTracklet: "trackB",
          }),
        );

        const state = getState().data;

        // Original tracklets should be deleted
        expect(state.tracklets.entities["trackB"]).toBeUndefined();

        // Find the new tracklet (should be only one tracklet now)
        const newTrackletId = Object.keys(state.tracklets.entities).find(
          (id) => !initialTrackletIds.includes(id),
        );
        expect(newTrackletId).toBeDefined();

        const newTracklet = state.tracklets.entities[newTrackletId!];
        expect(newTracklet?.linkedIds).toHaveLength(4);
        expect(newTracklet?.linkedIds).toContain("ann0");
        expect(newTracklet?.linkedIds).toContain("ann1");
        expect(newTracklet?.linkedIds).toContain("ann2");
        expect(newTracklet?.linkedIds).toContain("ann3");
        expect(newTracklet?.start).toBe(0);
        expect(newTracklet?.end).toBe(3);

        // All annotations should have new tracklet ID
        expect(state.annotations.entities["ann0"]?.trackId).toBe(newTrackletId);
        expect(state.annotations.entities["ann1"]?.trackId).toBe(newTrackletId);
        expect(state.annotations.entities["ann2"]?.trackId).toBe(newTrackletId);
        expect(state.annotations.entities["ann3"]?.trackId).toBe(newTrackletId);
      });

      it("should preserve parent relationships when joining tracklets", () => {
        const ann0 = createMockAnnotation({
          id: "ann0",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img2",
          timepoint: 2,
          kind: "annotation-kind",
        });
        store.dispatch(
          dataSlice.actions.batchAddAnnotations([ann0, ann1, ann2]),
        );

        const parent = createMockTracklet({
          id: "parent1",
          linkedIds: ["ann0"],
          start: 0,
          end: 0,
        });
        const childA = createMockTracklet({
          id: "childA",
          linkedIds: ["ann1"],
          start: 1,
          end: 1,
        });
        const childB = createMockTracklet({
          id: "childB",
          linkedIds: ["ann2"],
          start: 2,
          end: 2,
        });

        store.dispatch(dataSlice.actions.addTracklet(parent));
        store.dispatch(dataSlice.actions.addTracklet(childA));
        store.dispatch(dataSlice.actions.addTracklet(childB));

        store.dispatch(
          dataSlice.actions.addChildrenToTracklet({
            parentId: "parent1",
            childIds: ["childA", "childB"],
          }),
        );

        const initialState = getState().data;
        const initialTrackletIds = Object.keys(initialState.tracklets.entities);

        store.dispatch(
          dataSlice.actions.joinTracklets({
            primaryTracklet: "childA",
            joinedTracklet: "childB",
          }),
        );

        const state = getState().data;

        // Find new joined tracklet
        const newTrackletId = Object.keys(state.tracklets.entities).find(
          (id) => !initialTrackletIds.includes(id),
        );

        // New tracklet should be child of parent
        expect(state.tracklets.entities["parent1"]?.children).toContain(
          newTrackletId,
        );
        expect(state.tracklets.entities[newTrackletId!]?.parents).toContain(
          "parent1",
        );
      });

      it("should preserve child relationships when joining tracklets", () => {
        const ann0 = createMockAnnotation({
          id: "ann0",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img2",
          timepoint: 2,
          kind: "annotation-kind",
        });
        store.dispatch(
          dataSlice.actions.batchAddAnnotations([ann0, ann1, ann2]),
        );

        const parentA = createMockTracklet({
          id: "parentA",
          linkedIds: ["ann0"],
          start: 0,
          end: 0,
        });
        const parentB = createMockTracklet({
          id: "parentB",
          linkedIds: ["ann1"],
          start: 1,
          end: 1,
        });
        const child = createMockTracklet({
          id: "child1",
          linkedIds: ["ann2"],
          start: 2,
          end: 2,
        });

        store.dispatch(dataSlice.actions.addTracklet(parentA));
        store.dispatch(dataSlice.actions.addTracklet(parentB));
        store.dispatch(dataSlice.actions.addTracklet(child));

        store.dispatch(
          dataSlice.actions.addChildrenToTracklet({
            parentId: "parentA",
            childIds: ["child1"],
          }),
        );
        store.dispatch(
          dataSlice.actions.addChildrenToTracklet({
            parentId: "parentB",
            childIds: ["child1"],
          }),
        );

        const initialState = getState().data;
        const initialTrackletIds = Object.keys(initialState.tracklets.entities);

        store.dispatch(
          dataSlice.actions.joinTracklets({
            primaryTracklet: "parentA",
            joinedTracklet: "parentB",
          }),
        );

        const state = getState().data;

        // Find new joined tracklet
        const newTrackletId = Object.keys(state.tracklets.entities).find(
          (id) => !initialTrackletIds.includes(id),
        );

        // New tracklet should be parent of child
        expect(state.tracklets.entities[newTrackletId!]?.children).toContain(
          "child1",
        );
        expect(state.tracklets.entities["child1"]?.parents).toContain(
          newTrackletId,
        );
      });

      it("should sever tracklet at timepoint", () => {
        const annotations = [0, 1, 2, 3, 4].map((tp) =>
          createMockAnnotation({
            id: `ann${tp}`,
            imageId: `img${tp}`,
            timepoint: tp,
            kind: "annotation-kind",
          }),
        );
        store.dispatch(dataSlice.actions.batchAddAnnotations(annotations));

        const tracklet = createMockTracklet({
          id: "track1",
          linkedIds: ["ann0", "ann1", "ann2", "ann3", "ann4"],
          start: 0,
          end: 4,
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        const initialState = getState().data;
        const initialTrackletIds = Object.keys(initialState.tracklets.entities);

        store.dispatch(
          dataSlice.actions.severTracklet({ id: "track1", timepoint: 2 }),
        );

        const state = getState().data;

        // Original tracklet should be deleted
        expect(state.tracklets.entities["track1"]).toBeUndefined();

        // Find the two new tracklets
        const newTrackletIds = Object.keys(state.tracklets.entities).filter(
          (id) => !initialTrackletIds.includes(id),
        );
        expect(newTrackletIds).toHaveLength(2);

        const tracklets = newTrackletIds.map(
          (id) => state.tracklets.entities[id]!,
        );

        // Find left and right tracklets by their start times
        const leftTracklet = tracklets.find((t) => t.start === 0);
        const rightTracklet = tracklets.find((t) => t.start === 2);

        expect(leftTracklet).toBeDefined();
        expect(rightTracklet).toBeDefined();

        // Left tracklet should have timepoints 0, 1
        expect(leftTracklet?.end).toBe(1);
        expect(leftTracklet?.linkedIds).toContain("ann0");
        expect(leftTracklet?.linkedIds).toContain("ann1");
        expect(leftTracklet?.linkedIds).not.toContain("ann2");

        // Right tracklet should have timepoints 2, 3, 4
        expect(rightTracklet?.end).toBe(4);
        expect(rightTracklet?.linkedIds).toContain("ann2");
        expect(rightTracklet?.linkedIds).toContain("ann3");
        expect(rightTracklet?.linkedIds).toContain("ann4");
        expect(rightTracklet?.linkedIds).not.toContain("ann1");
      });

      it("should not sever at boundary timepoints", () => {
        const ann0 = createMockAnnotation({
          id: "ann0",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img2",
          timepoint: 2,
          kind: "annotation-kind",
        });
        store.dispatch(
          dataSlice.actions.batchAddAnnotations([ann0, ann1, ann2]),
        );

        const tracklet = createMockTracklet({
          id: "track1",
          linkedIds: ["ann0", "ann1", "ann2"],
          start: 0,
          end: 2,
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        // Try to sever at start boundary
        store.dispatch(
          dataSlice.actions.severTracklet({ id: "track1", timepoint: 0 }),
        );

        let state = getState().data;
        expect(state.tracklets.entities["track1"]).toBeDefined();
        expect(state.tracklets.entities["track1"]?.linkedIds).toHaveLength(3);

        // Try to sever at end boundary
        store.dispatch(
          dataSlice.actions.severTracklet({ id: "track1", timepoint: 2 }),
        );

        state = getState().data;
        expect(state.tracklets.entities["track1"]).toBeDefined();
        expect(state.tracklets.entities["track1"]?.linkedIds).toHaveLength(3);
      });

      it("should transfer parent/child relationships when severing", () => {
        const annotations = [0, 1, 2, 3].map((tp) =>
          createMockAnnotation({
            id: `ann${tp}`,
            imageId: `img${tp}`,
            timepoint: tp,
            kind: "annotation-kind",
          }),
        );
        store.dispatch(dataSlice.actions.batchAddAnnotations(annotations));

        const parent = createMockTracklet({
          id: "parent1",
          linkedIds: [],
          start: 0,
          end: 0,
        });
        const child = createMockTracklet({
          id: "child1",
          linkedIds: [],
          start: 3,
          end: 3,
        });
        const middle = createMockTracklet({
          id: "middle1",
          linkedIds: ["ann0", "ann1", "ann2", "ann3"],
          start: 0,
          end: 3,
        });

        store.dispatch(dataSlice.actions.addTracklet(parent));
        store.dispatch(dataSlice.actions.addTracklet(child));
        store.dispatch(dataSlice.actions.addTracklet(middle));

        store.dispatch(
          dataSlice.actions.addChildrenToTracklet({
            parentId: "parent1",
            childIds: ["middle1"],
          }),
        );
        store.dispatch(
          dataSlice.actions.addChildrenToTracklet({
            parentId: "middle1",
            childIds: ["child1"],
          }),
        );

        const initialState = getState().data;
        const initialTrackletIds = Object.keys(initialState.tracklets.entities);

        store.dispatch(
          dataSlice.actions.severTracklet({ id: "middle1", timepoint: 2 }),
        );

        const state = getState().data;

        // Find the two new tracklets
        const newTrackletIds = Object.keys(state.tracklets.entities).filter(
          (id) => !initialTrackletIds.includes(id),
        );

        const tracklets = newTrackletIds.map(
          (id) => state.tracklets.entities[id]!,
        );

        const leftTracklet = tracklets.find((t) => t.start === 0);
        const rightTracklet = tracklets.find((t) => t.start === 2);

        // Left tracklet should inherit parent relationship
        expect(leftTracklet?.parents).toContain("parent1");
        expect(state.tracklets.entities["parent1"]?.children).toContain(
          leftTracklet?.id,
        );

        // Right tracklet should inherit child relationship
        expect(rightTracklet?.children).toContain("child1");
        expect(state.tracklets.entities["child1"]?.parents).toContain(
          rightTracklet?.id,
        );
      });
    });

    describe("Batch Operations", () => {
      it("should batch add tracklets", () => {
        const tracklets = [
          createMockTracklet({ id: "track1" }),
          createMockTracklet({ id: "track2" }),
          createMockTracklet({ id: "track3" }),
        ];

        store.dispatch(dataSlice.actions.batchAddTracklet(tracklets));

        const state = getState().data;
        expect(state.tracklets.entities["track1"]).toBeDefined();
        expect(state.tracklets.entities["track2"]).toBeDefined();
        expect(state.tracklets.entities["track3"]).toBeDefined();
        expect(state.relationships.metadataToTracklets["meta1"]).toHaveLength(
          3,
        );
      });

      it("should batch add annotations to tracklet", () => {
        const annotations = [0, 1, 2, 3, 4].map((tp) =>
          createMockAnnotation({
            id: `ann${tp}`,
            imageId: `img${tp}`,
            timepoint: tp,
            kind: "annotation-kind",
          }),
        );
        store.dispatch(dataSlice.actions.batchAddAnnotations(annotations));

        const tracklet = createMockTracklet({
          id: "track1",
          linkedIds: [],
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        store.dispatch(
          dataSlice.actions.batchAddAnnotationToTracklet([
            {
              trackId: "track1",
              annIds: ["ann0", "ann1", "ann2", "ann3", "ann4"],
            },
          ]),
        );

        const state = getState().data;
        const updatedTracklet = state.tracklets.entities["track1"];
        expect(updatedTracklet?.linkedIds).toHaveLength(5);
        expect(updatedTracklet?.start).toBe(0);
        expect(updatedTracklet?.end).toBe(4);
        expect(state.annotations.entities["ann0"]?.trackId).toBe("track1");
        expect(state.annotations.entities["ann4"]?.trackId).toBe("track1");
      });

      it("should batch add annotations to multiple tracklets", () => {
        const annotations = [0, 1, 2, 3].map((tp) =>
          createMockAnnotation({
            id: `ann${tp}`,
            imageId: `img${tp}`,
            timepoint: tp,
            kind: "annotation-kind",
          }),
        );
        store.dispatch(dataSlice.actions.batchAddAnnotations(annotations));

        const track1 = createMockTracklet({ id: "track1", linkedIds: [] });
        const track2 = createMockTracklet({ id: "track2", linkedIds: [] });
        store.dispatch(dataSlice.actions.addTracklet(track1));
        store.dispatch(dataSlice.actions.addTracklet(track2));

        store.dispatch(
          dataSlice.actions.batchAddAnnotationToTracklet([
            { trackId: "track1", annIds: ["ann0", "ann1"] },
            { trackId: "track2", annIds: ["ann2", "ann3"] },
          ]),
        );

        const state = getState().data;
        expect(state.tracklets.entities["track1"]?.linkedIds).toEqual([
          "ann0",
          "ann1",
        ]);
        expect(state.tracklets.entities["track2"]?.linkedIds).toEqual([
          "ann2",
          "ann3",
        ]);
        expect(state.annotations.entities["ann0"]?.trackId).toBe("track1");
        expect(state.annotations.entities["ann2"]?.trackId).toBe("track2");
      });

      it("should batch delete tracklets", () => {
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        const ann3 = createMockAnnotation({
          id: "ann3",
          imageId: "img2",
          timepoint: 2,
          kind: "annotation-kind",
        });
        store.dispatch(
          dataSlice.actions.batchAddAnnotations([ann1, ann2, ann3]),
        );

        const tracklets = [
          createMockTracklet({ id: "track1", linkedIds: ["ann1"] }),
          createMockTracklet({ id: "track2", linkedIds: ["ann2"] }),
          createMockTracklet({ id: "track3", linkedIds: ["ann3"] }),
        ];
        store.dispatch(dataSlice.actions.batchAddTracklet(tracklets));

        store.dispatch(
          dataSlice.actions.batchDeleteTracklet(["track1", "track3"]),
        );

        const state = getState().data;
        expect(state.tracklets.entities["track1"]).toBeUndefined();
        expect(state.tracklets.entities["track2"]).toBeDefined();
        expect(state.tracklets.entities["track3"]).toBeUndefined();
        expect(state.annotations.entities["ann1"]?.trackId).toBeUndefined();
        expect(state.annotations.entities["ann2"]?.trackId).toBe("track2");
        expect(state.annotations.entities["ann3"]?.trackId).toBeUndefined();
      });
    });

    describe("Edge Cases & Error Handling", () => {
      it("should handle operations on non-existent tracklet gracefully", () => {
        const consoleError = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});

        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        store.dispatch(dataSlice.actions.addAnnotation(ann1));

        // Try updateTrackletColor on non-existent ID
        store.dispatch(
          dataSlice.actions.updateTrackletColor({
            id: "non-existent",
            color: "#00FF00",
          }),
        );

        // Try addAnnotationToTracklet on non-existent ID
        store.dispatch(
          dataSlice.actions.addAnnotationToTracklet({
            trackId: "non-existent",
            annId: "ann1",
          }),
        );

        // Try removeAnnotationFromTracklet on non-existent ID
        store.dispatch(
          dataSlice.actions.removeAnnotationFromTracklet({
            trackId: "non-existent",
            annId: "ann1",
          }),
        );

        // Verify no errors thrown and state unchanged
        const state = getState().data;
        expect(state).toBeDefined();
        expect(state.annotations.entities["ann1"]?.trackId).toBeUndefined();

        consoleError.mockRestore();
      });

      it("should handle empty tracklet after all annotations removed", () => {
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        const ann3 = createMockAnnotation({
          id: "ann3",
          imageId: "img2",
          timepoint: 2,
          kind: "annotation-kind",
        });
        store.dispatch(
          dataSlice.actions.batchAddAnnotations([ann1, ann2, ann3]),
        );

        // Create tracklet with 3 annotations
        const tracklet = createMockTracklet({
          id: "track1",
          linkedIds: ["ann1", "ann2", "ann3"],
          start: 0,
          end: 2,
        });
        store.dispatch(dataSlice.actions.addTracklet(tracklet));

        // Verify tracklet exists
        let state = getState().data;
        expect(state.tracklets.entities["track1"]).toBeDefined();
        expect(state.relationships.metadataToTracklets["meta1"]).toContain(
          "track1",
        );

        // Remove first annotation
        store.dispatch(
          dataSlice.actions.removeAnnotationFromTracklet({
            trackId: "track1",
            annId: "ann1",
          }),
        );

        state = getState().data;
        expect(state.tracklets.entities["track1"]).toBeDefined();
        expect(state.tracklets.entities["track1"]?.linkedIds).toHaveLength(2);

        // Remove second annotation
        store.dispatch(
          dataSlice.actions.removeAnnotationFromTracklet({
            trackId: "track1",
            annId: "ann2",
          }),
        );

        state = getState().data;
        expect(state.tracklets.entities["track1"]).toBeDefined();
        expect(state.tracklets.entities["track1"]?.linkedIds).toHaveLength(1);

        // Remove last annotation - tracklet should auto-delete
        store.dispatch(
          dataSlice.actions.removeAnnotationFromTracklet({
            trackId: "track1",
            annId: "ann3",
          }),
        );

        state = getState().data;
        // Verify tracklet auto-deleted after last removal
        expect(state.tracklets.entities["track1"]).toBeUndefined();
        // Verify metadata relationship cleaned up
        expect(state.relationships.metadataToTracklets["meta1"]).not.toContain(
          "track1",
        );
        // Verify all annotations' trackId cleared
        expect(state.annotations.entities["ann1"]?.trackId).toBeUndefined();
        expect(state.annotations.entities["ann2"]?.trackId).toBeUndefined();
        expect(state.annotations.entities["ann3"]?.trackId).toBeUndefined();
      });

      it("should maintain relationship consistency during complex cascade", () => {
        const ann1 = createMockAnnotation({
          id: "ann1",
          imageId: "img0",
          timepoint: 0,
          kind: "annotation-kind",
        });
        const ann2 = createMockAnnotation({
          id: "ann2",
          imageId: "img1",
          timepoint: 1,
          kind: "annotation-kind",
        });
        store.dispatch(dataSlice.actions.batchAddAnnotations([ann1, ann2]));

        // Create graph: parent → middle (with annotations) → child
        const parent = createMockTracklet({
          id: "parent1",
          linkedIds: [],
          start: 0,
          end: 0,
        });
        const middle = createMockTracklet({
          id: "middle1",
          linkedIds: ["ann1", "ann2"],
          start: 0,
          end: 1,
        });
        const child = createMockTracklet({
          id: "child1",
          linkedIds: [],
          start: 2,
          end: 2,
        });

        store.dispatch(dataSlice.actions.addTracklet(parent));
        store.dispatch(dataSlice.actions.addTracklet(middle));
        store.dispatch(dataSlice.actions.addTracklet(child));

        // Set up relationships
        store.dispatch(
          dataSlice.actions.addChildrenToTracklet({
            parentId: "parent1",
            childIds: ["middle1"],
          }),
        );
        store.dispatch(
          dataSlice.actions.addChildrenToTracklet({
            parentId: "middle1",
            childIds: ["child1"],
          }),
        );

        // Verify initial state
        let state = getState().data;
        expect(state.tracklets.entities["parent1"]?.children).toContain(
          "middle1",
        );
        expect(state.tracklets.entities["middle1"]?.parents).toContain(
          "parent1",
        );
        expect(state.tracklets.entities["middle1"]?.children).toContain(
          "child1",
        );
        expect(state.tracklets.entities["child1"]?.parents).toContain(
          "middle1",
        );

        // Delete middle tracklet
        store.dispatch(dataSlice.actions.deleteTracklet("middle1"));

        state = getState().data;
        // Verify tracklet deleted
        expect(state.tracklets.entities["middle1"]).toBeUndefined();

        // Verify parent's children updated
        expect(state.tracklets.entities["parent1"]?.children).not.toContain(
          "middle1",
        );

        // Verify child's parents updated
        expect(state.tracklets.entities["child1"]?.parents).not.toContain(
          "middle1",
        );

        // Verify annotations' trackId cleared
        expect(state.annotations.entities["ann1"]?.trackId).toBeUndefined();
        expect(state.annotations.entities["ann2"]?.trackId).toBeUndefined();

        // Verify metadata relationship cleaned up
        expect(state.relationships.metadataToTracklets["meta1"]).not.toContain(
          "middle1",
        );
      });

      it("should handle join with non-contiguous tracklets", () => {
        // Create annotations at timepoints 0-2, 5-7, 10-12 (gaps between)
        const annotations = [
          ...[0, 1, 2].map((tp) =>
            createMockAnnotation({
              id: `ann${tp}`,
              imageId: `img${tp}`,
              timepoint: tp,
              kind: "annotation-kind",
            }),
          ),
          // Gap from 3-4
          ...[0, 1, 2].map((i) =>
            createMockAnnotation({
              id: `ann${5 + i}`,
              imageId: `img${i}`,
              timepoint: 5 + i,
              kind: "annotation-kind",
            }),
          ),
          // Gap from 8-9
          ...[0, 1, 2].map((i) =>
            createMockAnnotation({
              id: `ann${10 + i}`,
              imageId: `img${i}`,
              timepoint: 10 + i,
              kind: "annotation-kind",
            }),
          ),
        ];
        store.dispatch(dataSlice.actions.batchAddAnnotations(annotations));

        // Create tracklets at non-contiguous timepoints
        const trackletA = createMockTracklet({
          id: "trackA",
          linkedIds: ["ann0", "ann1", "ann2"],
          start: 0,
          end: 2,
        });
        const trackletB = createMockTracklet({
          id: "trackB",
          linkedIds: ["ann5", "ann6", "ann7"],
          start: 5,
          end: 7,
        });
        const trackletC = createMockTracklet({
          id: "trackC",
          linkedIds: ["ann10", "ann11", "ann12"],
          start: 10,
          end: 12,
        });

        store.dispatch(dataSlice.actions.addTracklet(trackletA));
        store.dispatch(dataSlice.actions.addTracklet(trackletB));
        store.dispatch(dataSlice.actions.addTracklet(trackletC));

        const initialState = getState().data;
        const initialTrackletIds = Object.keys(initialState.tracklets.entities);

        // Join all three tracklets
        store.dispatch(
          dataSlice.actions.joinTracklets({
            primaryTracklet: "trackA",
            joinedTracklet: "trackB",
          }),
        );

        const state = getState().data;

        // Original tracklets should be deleted
        expect(state.tracklets.entities["trackA"]).toBeUndefined();
        expect(state.tracklets.entities["trackB"]).toBeUndefined();
        expect(state.tracklets.entities["trackC"]).toBeUndefined();

        // Find the new tracklet
        const newTrackletId = Object.keys(state.tracklets.entities).find(
          (id) => !initialTrackletIds.includes(id),
        );
        expect(newTrackletId).toBeDefined();

        const newTracklet = state.tracklets.entities[newTrackletId!];

        // Verify single tracklet spanning 0-12
        expect(newTracklet?.start).toBe(0);
        expect(newTracklet?.end).toBe(12);

        // Verify all annotations transferred
        expect(newTracklet?.linkedIds).toHaveLength(9);
        expect(newTracklet?.linkedIds).toContain("ann0");
        expect(newTracklet?.linkedIds).toContain("ann1");
        expect(newTracklet?.linkedIds).toContain("ann2");
        expect(newTracklet?.linkedIds).toContain("ann5");
        expect(newTracklet?.linkedIds).toContain("ann6");
        expect(newTracklet?.linkedIds).toContain("ann7");
        expect(newTracklet?.linkedIds).toContain("ann10");
        expect(newTracklet?.linkedIds).toContain("ann11");
        expect(newTracklet?.linkedIds).toContain("ann12");

        // Verify all annotations have new tracklet ID
        for (const annId of newTracklet!.linkedIds) {
          expect(state.annotations.entities[annId]?.trackId).toBe(
            newTrackletId,
          );
        }
      });
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
      const allTracklets = selectAllTracklets(state);

      expect(allKinds).toHaveLength(1); // IMAGE_KIND
      expect(allKinds[0].id).toBe(IMAGE_KIND);
      expect(allCategories).toHaveLength(1); // Unknown image category
      expect(allCategories[0].name).toBe("Unknown");
      expect(allMetadata).toHaveLength(0);
      expect(allImages).toHaveLength(0);
      expect(allAnnotations).toHaveLength(0);
      expect(allTracklets).toHaveLength(0);

      const dataState = state.data;
      expect(
        Object.keys(dataState.relationships.kindToCategories),
      ).toHaveLength(1);
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
      store.dispatch(dataSlice.actions.deleteKind("Annotation"));

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
