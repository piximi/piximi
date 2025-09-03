import { describe, it, expect, beforeEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import dataReducer, {
  addKind,
  updateKind,
  deleteKind,
  deleteKindCascade,
  addCategory,
  updateCategory,
  deleteCategory,
  deleteCategoryCascade,
  addImage,
  updateImage,
  deleteImage,
  deleteImageCascade,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  deleteAnnotationsBatch,
  batchAddAnnotations,
  addLinkNode,
  updateLinkNode,
  deleteLinkNode,
  addGlobalAnnotation,
  deleteGlobalAnnotation,
  clearAll,
  setVisibilityForCategory,
  setVisibilityForKind,
  kindsSelectors,
  categoriesSelectors,
  imagesSelectors,
  annotationsSelectors,
  DataStateV2,
} from "./dataSliceV2";
import {
  Category,
  GlobalAnnotation,
  Kind,
  LinkNode,
  TSAnnotationObject,
  TSImageObject,
} from "./types";
import { Partition } from "utils/models/enums";
import { Tensor2D, Tensor4D } from "@tensorflow/tfjs";
import { generateDefaultColors } from "utils/tensorUtils";

// Mock data factories
const createMockKind = (overrides = {}): Kind => ({
  id: "kind1",
  displayName: "Test Kind",
  containing: [],
  categories: [],
  unknownCategoryId: "unknown-cat",
  ...overrides,
});

const createMockCategory = (overrides = {}): Category => ({
  id: "cat1",
  name: "Test Category",
  color: "#FF0000",
  visible: true,
  containing: [],
  kind: "kind1",
  ...overrides,
});

const createMockImage = (overrides = {}): TSImageObject => ({
  id: "img1",
  name: "Test Image",
  kind: "kind1",
  bitDepth: 8,
  containing: [],
  partition: Partition.Inference,
  shape: { width: 100, height: 100, planes: 1, channels: 1 },
  timepoints: {
    "0": {
      colors: {
        color: {} as Tensor2D,
        range: { 0: [0, 1] },
        visible: { 0: true },
      },
      src: "test.png",
      data: {} as Tensor4D,
      categoryId: "cat1",
      activePlane: 0,
    },
  },
  ...overrides,
});

const createMockAnnotation = (overrides = {}): TSAnnotationObject => ({
  id: "ann1",
  name: "Test Annotation",
  kind: "annotation-kind",
  bitDepth: 8,
  partition: Partition.Inference,
  src: "test.png",
  boundingBox: [0, 0, 10, 10],
  encodedMask: [1, 2, 3],
  plane: 0,
  imageId: "img1",
  timepoint: "0",
  categoryId: "cat1",
  shape: { width: 100, height: 100, planes: 1, channels: 1 },
  data: {} as Tensor4D,
  ...overrides,
});

const createMockLinkNode = (overrides = {}): LinkNode => ({
  id: "link1",
  time: 0,
  globalId: "global1",
  parentIds: [],
  childIds: [],
  ...overrides,
});

describe("Data Slice", () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        data: dataReducer,
      },
    });
  });

  describe("Kind Operations", () => {
    it("should add a kind", () => {
      const kind = createMockKind();
      store.dispatch(addKind(kind));

      const state = store.getState() as { data: DataStateV2 };
      expect(kindsSelectors.selectById(state, "kind1")).toEqual(kind);
      expect(state.data.relationships.kindToCategories["kind1"]).toEqual([]);
      expect(state.data.relationships.kindToImages["kind1"]).toEqual([]);
      expect(state.data.relationships.kindToAnnotations["kind1"]).toEqual([]);
    });

    it("should update a kind", () => {
      const kind = createMockKind();
      store.dispatch(addKind(kind));
      store.dispatch(
        updateKind({
          id: "kind1",
          changes: { displayName: "Updated Kind" },
        }),
      );

      const state = store.getState() as { data: DataStateV2 };
      expect(kindsSelectors.selectById(state, "kind1")?.displayName).toBe(
        "Updated Kind",
      );
    });

    it("should delete a kind without cascade", () => {
      const kind = createMockKind();
      store.dispatch(addKind(kind));
      store.dispatch(deleteKind("kind1"));

      const state = store.getState() as { data: DataStateV2 };
      expect(kindsSelectors.selectById(state, "kind1")).toBeUndefined();
      expect(
        state.data.relationships.kindToCategories["kind1"],
      ).toBeUndefined();
    });

    it("should cascade delete a kind with all related entities", () => {
      // Setup: Create a kind with category, image, and annotation
      const kind = createMockKind({ categories: ["cat1"] });
      const category = createMockCategory({ kind: "kind1" });
      const image = createMockImage({ kind: "kind1" });
      const annotation = createMockAnnotation({
        kind: "kind1",
        imageId: "img1",
      });

      store.dispatch(addKind(kind));
      store.dispatch(addCategory(category));
      store.dispatch(addImage(image));
      store.dispatch(addAnnotation(annotation));

      // Verify setup
      let state = store.getState() as { data: DataStateV2 };
      expect(kindsSelectors.selectTotal(state)).toBe(1);
      expect(categoriesSelectors.selectTotal(state)).toBe(1);
      expect(imagesSelectors.selectTotal(state)).toBe(1);
      expect(annotationsSelectors.selectTotal(state)).toBe(1);

      // Cascade delete
      store.dispatch(deleteKindCascade("kind1"));

      // Verify all entities are deleted
      state = store.getState() as { data: DataStateV2 };
      expect(kindsSelectors.selectTotal(state)).toBe(0);
      expect(categoriesSelectors.selectTotal(state)).toBe(0);
      expect(imagesSelectors.selectTotal(state)).toBe(0);
      expect(annotationsSelectors.selectTotal(state)).toBe(0);

      // Verify relationships are cleaned up
      expect(
        Object.keys(state.data.relationships.kindToCategories),
      ).toHaveLength(0);
      expect(
        Object.keys(state.data.relationships.imageToAnnotations),
      ).toHaveLength(0);
    });
  });

  describe("Category Operations", () => {
    it("should add a category and update relationships", () => {
      const kind = createMockKind();
      const category = createMockCategory();

      store.dispatch(addKind(kind));
      store.dispatch(addCategory(category));

      const state = store.getState() as { data: DataStateV2 };
      expect(categoriesSelectors.selectById(state, "cat1")).toEqual(category);
      expect(state.data.relationships.kindToCategories["kind1"]).toContain(
        "cat1",
      );
      expect(state.data.relationships.categoryToImages["cat1"]).toEqual([]);
    });

    it("should update a category including kind change", () => {
      const kind1 = createMockKind();
      const kind2 = createMockKind({ id: "kind2", displayName: "Kind 2" });
      const kind3 = createMockKind();
      const category = createMockCategory();

      store.dispatch(addKind(kind1));
      store.dispatch(addKind(kind2));
      store.dispatch(addKind(kind3));
      store.dispatch(addCategory(category));

      // Change kind
      store.dispatch(
        updateCategory({
          id: "cat1",
          changes: { kind: "kind2" },
        }),
      );

      const state = store.getState() as { data: DataStateV2 };
      console.log(state.data.relationships.kindToCategories);
      expect(categoriesSelectors.selectById(state, "cat1")?.kind).toBe("kind2");
      expect(state.data.relationships.kindToCategories["kind1"]).not.toContain(
        "cat1",
      );
      expect(state.data.relationships.kindToCategories["kind2"]).toContain(
        "cat1",
      );
    });

    it("should cascade delete category and reassign to unknown", () => {
      const kind = createMockKind({ unknownCategoryId: "unknown-cat" });
      const unknownCategory = createMockCategory({
        id: "unknown-cat",
        name: "Unknown",
        kind: "kind1",
      });
      const category = createMockCategory();
      const image = createMockImage();
      const annotation = createMockAnnotation();

      store.dispatch(addKind(kind));
      store.dispatch(addCategory(unknownCategory));
      store.dispatch(addCategory(category));
      store.dispatch(addImage(image));
      store.dispatch(addAnnotation(annotation));

      // Delete category with cascade
      store.dispatch(deleteCategoryCascade("cat1"));

      const state = store.getState() as { data: DataStateV2 };
      expect(categoriesSelectors.selectById(state, "cat1")).toBeUndefined();

      // Check that image and annotation were reassigned to unknown category
      const updatedImage = imagesSelectors.selectById(state, "img1");
      expect(updatedImage?.timepoints["0"].categoryId).toBe("unknown-cat");

      const updatedAnnotation = annotationsSelectors.selectById(state, "ann1");
      expect(updatedAnnotation?.categoryId).toBe("unknown-cat");

      // Check relationships
      expect(
        state.data.relationships.categoryToImages["unknown-cat"],
      ).toContain("img1");
      expect(
        state.data.relationships.categoryToAnnotations["unknown-cat"],
      ).toContain("ann1");
    });
  });

  describe("Image Operations", () => {
    it("should add an image with relationships", () => {
      const kind = createMockKind();
      const category = createMockCategory();
      const image = createMockImage();

      store.dispatch(addKind(kind));
      store.dispatch(addCategory(category));
      store.dispatch(addImage(image));

      const state = store.getState() as { data: DataStateV2 };
      expect(imagesSelectors.selectById(state, "img1")).toEqual(image);
      expect(state.data.relationships.kindToImages["kind1"]).toContain("img1");
      expect(state.data.relationships.categoryToImages["cat1"]).toContain(
        "img1",
      );
      expect(state.data.relationships.imageToAnnotations["img1"]).toEqual([]);
    });

    it("should update an image including kind change", () => {
      const kind1 = createMockKind();
      const kind2 = createMockKind({ id: "kind2" });
      const image = createMockImage();

      store.dispatch(addKind(kind1));
      store.dispatch(addKind(kind2));
      store.dispatch(addImage(image));

      store.dispatch(
        updateImage({
          id: "img1",
          changes: { kind: "kind2" },
        }),
      );

      const state = store.getState() as { data: DataStateV2 };
      expect(imagesSelectors.selectById(state, "img1")?.kind).toBe("kind2");
      expect(state.data.relationships.kindToImages["kind1"]).not.toContain(
        "img1",
      );
      expect(state.data.relationships.kindToImages["kind2"]).toContain("img1");
    });

    it("should cascade delete image with annotations", () => {
      const image = createMockImage();
      const annotation1 = createMockAnnotation({ id: "ann1" });
      const annotation2 = createMockAnnotation({ id: "ann2" });

      store.dispatch(addImage(image));
      store.dispatch(addAnnotation(annotation1));
      store.dispatch(addAnnotation(annotation2));

      store.dispatch(deleteImageCascade("img1"));

      const state = store.getState() as { data: DataStateV2 };
      expect(imagesSelectors.selectById(state, "img1")).toBeUndefined();
      expect(annotationsSelectors.selectById(state, "ann1")).toBeUndefined();
      expect(annotationsSelectors.selectById(state, "ann2")).toBeUndefined();
      expect(
        state.data.relationships.imageToAnnotations["img1"],
      ).toBeUndefined();
    });
  });

  describe("Annotation Operations", () => {
    it("should add annotation with relationships", () => {
      const image = createMockImage();
      const annotation = createMockAnnotation();

      store.dispatch(addImage(image));
      store.dispatch(addAnnotation(annotation));

      const state = store.getState() as { data: DataStateV2 };
      expect(annotationsSelectors.selectById(state, "ann1")).toEqual(
        annotation,
      );
      expect(state.data.relationships.imageToAnnotations["img1"]).toContain(
        "ann1",
      );
      expect(state.data.relationships.categoryToAnnotations["cat1"]).toContain(
        "ann1",
      );
      expect(
        state.data.relationships.kindToAnnotations["annotation-kind"],
      ).toContain("ann1");
    });

    it("should update annotation relationships correctly", () => {
      const image1 = createMockImage({ id: "img1" });
      const image2 = createMockImage({ id: "img2" });
      const annotation = createMockAnnotation();

      store.dispatch(addImage(image1));
      store.dispatch(addImage(image2));
      store.dispatch(addAnnotation(annotation));

      store.dispatch(
        updateAnnotation({
          id: "ann1",
          changes: { imageId: "img2" },
        }),
      );

      const state = store.getState() as { data: DataStateV2 };
      expect(annotationsSelectors.selectById(state, "ann1")?.imageId).toBe(
        "img2",
      );
      expect(state.data.relationships.imageToAnnotations["img1"]).not.toContain(
        "ann1",
      );
      expect(state.data.relationships.imageToAnnotations["img2"]).toContain(
        "ann1",
      );
    });

    it("should batch add annotations", () => {
      const annotations = [
        createMockAnnotation({ id: "ann1" }),
        createMockAnnotation({ id: "ann2" }),
        createMockAnnotation({ id: "ann3" }),
      ];

      store.dispatch(batchAddAnnotations(annotations));

      const state = store.getState() as { data: DataStateV2 };
      expect(annotationsSelectors.selectTotal(state)).toBe(3);
      expect(state.data.relationships.imageToAnnotations["img1"]).toEqual([
        "ann1",
        "ann2",
        "ann3",
      ]);
    });

    it("should batch delete annotations", () => {
      const annotations = [
        createMockAnnotation({ id: "ann1" }),
        createMockAnnotation({ id: "ann2" }),
        createMockAnnotation({ id: "ann3" }),
      ];

      store.dispatch(batchAddAnnotations(annotations));
      store.dispatch(deleteAnnotationsBatch(["ann1", "ann3"]));

      const state = store.getState() as { data: DataStateV2 };
      expect(annotationsSelectors.selectTotal(state)).toBe(1);
      expect(annotationsSelectors.selectById(state, "ann2")).toBeDefined();
      expect(state.data.relationships.imageToAnnotations["img1"]).toEqual([
        "ann2",
      ]);
    });
  });

  describe("Link Graph Operations", () => {
    it("should add link node with relationships", () => {
      const parentNode = createMockLinkNode({ id: "parent", childIds: [] });
      const childNode = createMockLinkNode({
        id: "child",
        parentIds: ["parent"],
        childIds: [],
      });

      store.dispatch(addLinkNode(parentNode));
      store.dispatch(addLinkNode(childNode));

      const state = store.getState() as { data: DataStateV2 };
      expect(state.data.linkGraph["parent"].childIds).toContain("child");
      expect(state.data.linkGraph["child"].parentIds).toContain("parent");
      expect(state.data.globalAnnotations["global1"].linkedIds).toContain(
        "parent",
      );
      expect(state.data.globalAnnotations["global1"].linkedIds).toContain(
        "child",
      );
    });

    it("should update link node global ID", () => {
      const node = createMockLinkNode();

      store.dispatch(addLinkNode(node));
      store.dispatch(
        updateLinkNode({
          id: "link1",
          changes: { globalId: "global2" },
        }),
      );

      const state = store.getState() as { data: DataStateV2 };
      expect(state.data.linkGraph["link1"].globalId).toBe("global2");
      expect(state.data.globalAnnotations["global1"]).toBeUndefined();
      expect(state.data.globalAnnotations["global2"].linkedIds).toContain(
        "link1",
      );
    });

    it("should delete link node and update relationships", () => {
      const parent = createMockLinkNode({
        id: "parent",
        childIds: ["middle"],
        globalId: "global1",
      });
      const middle = createMockLinkNode({
        id: "middle",
        parentIds: ["parent"],
        childIds: ["child"],
        globalId: "global1",
      });
      const child = createMockLinkNode({
        id: "child",
        parentIds: ["middle"],
        globalId: "global1",
      });

      store.dispatch(addLinkNode(parent));
      store.dispatch(addLinkNode(middle));
      store.dispatch(addLinkNode(child));

      store.dispatch(deleteLinkNode("middle"));

      const state = store.getState() as { data: DataStateV2 };
      expect(state.data.linkGraph["middle"]).toBeUndefined();
      expect(state.data.linkGraph["parent"].childIds).not.toContain("middle");
      expect(state.data.linkGraph["child"].parentIds).not.toContain("middle");
      expect(state.data.globalAnnotations["global1"].linkedIds).not.toContain(
        "middle",
      );
      expect(state.data.globalAnnotations["global1"].linkedIds.size).toBe(2);
    });

    it("should clean up empty global annotations", () => {
      const node = createMockLinkNode();

      store.dispatch(addLinkNode(node));
      store.dispatch(deleteLinkNode("link1"));

      const state = store.getState() as { data: DataStateV2 };
      expect(state.data.globalAnnotations["global1"]).toBeUndefined();
    });
  });

  describe("Global Annotation Operations", () => {
    it("should add global annotation", () => {
      const globalAnnotation: GlobalAnnotation = {
        globalId: "global1",
        linkedIds: new Set(["ann1", "ann2"]),
      };

      store.dispatch(addGlobalAnnotation(globalAnnotation));

      const state = store.getState() as { data: DataStateV2 };
      expect(state.data.globalAnnotations["global1"]).toEqual(globalAnnotation);
    });

    it("should delete global annotation and clear from link nodes", () => {
      const node1 = createMockLinkNode({ id: "node1", globalId: "global1" });
      const node2 = createMockLinkNode({ id: "node2", globalId: "global1" });

      store.dispatch(addLinkNode(node1));
      store.dispatch(addLinkNode(node2));
      store.dispatch(deleteGlobalAnnotation("global1"));

      const state = store.getState() as { data: DataStateV2 };
      expect(state.data.globalAnnotations["global1"]).toBeUndefined();
      expect(state.data.linkGraph["node1"].globalId).toBe("");
      expect(state.data.linkGraph["node2"].globalId).toBe("");
    });
  });

  describe("Utility Operations", () => {
    it("should clear all data", () => {
      const kind = createMockKind();
      const category = createMockCategory();
      const image = createMockImage();
      const annotation = createMockAnnotation();

      store.dispatch(addKind(kind));
      store.dispatch(addCategory(category));
      store.dispatch(addImage(image));
      store.dispatch(addAnnotation(annotation));

      store.dispatch(clearAll());

      const state = store.getState() as { data: DataStateV2 };
      expect(kindsSelectors.selectTotal(state)).toBe(0);
      expect(categoriesSelectors.selectTotal(state)).toBe(0);
      expect(imagesSelectors.selectTotal(state)).toBe(0);
      expect(annotationsSelectors.selectTotal(state)).toBe(0);
      expect(
        Object.keys(state.data.relationships.kindToCategories),
      ).toHaveLength(0);
    });

    it("should set visibility for category", () => {
      const category = createMockCategory({ visible: true });

      store.dispatch(addCategory(category));
      store.dispatch(
        setVisibilityForCategory({ categoryId: "cat1", visible: false }),
      );

      const state = store.getState() as { data: DataStateV2 };
      expect(categoriesSelectors.selectById(state, "cat1")?.visible).toBe(
        false,
      );
    });

    it("should set visibility for all categories in a kind", () => {
      const kind = createMockKind();
      const cat1 = createMockCategory({ id: "cat1", visible: true });
      const cat2 = createMockCategory({ id: "cat2", visible: true });

      store.dispatch(addKind(kind));
      store.dispatch(addCategory(cat1));
      store.dispatch(addCategory(cat2));

      store.dispatch(setVisibilityForKind({ kindId: "kind1", visible: false }));

      const state = store.getState() as { data: DataStateV2 };
      expect(categoriesSelectors.selectById(state, "cat1")?.visible).toBe(
        false,
      );
      expect(categoriesSelectors.selectById(state, "cat2")?.visible).toBe(
        false,
      );
    });
  });

  describe("Complex Relationship Scenarios", () => {
    it("should maintain consistency when deleting annotation with link graph", () => {
      const annotation = createMockAnnotation();
      const linkNode = createMockLinkNode({ id: "ann1" });

      store.dispatch(addAnnotation(annotation));
      store.dispatch(addLinkNode(linkNode));
      store.dispatch(deleteAnnotation("ann1"));

      const state = store.getState() as { data: DataStateV2 };
      expect(annotationsSelectors.selectById(state, "ann1")).toBeUndefined();
      expect(state.data.linkGraph["ann1"]).toBeUndefined();
      expect(state.data.globalAnnotations["global1"]).toBeUndefined();
    });

    it("should handle multiple relationships correctly", () => {
      const kind = createMockKind();
      const cat1 = createMockCategory({ id: "cat1" });
      const cat2 = createMockCategory({ id: "cat2" });
      const image = createMockImage({
        timepoints: {
          "0": {
            colors: { c: 0 },
            src: "test.png",
            data: {} as Tensor4D,
            categoryId: "cat1",
            activePlane: 0,
          },
          "1": {
            colors: { c: 0 },
            src: "test.png",
            data: {} as Tensor4D,
            categoryId: "cat2",
            activePlane: 0,
          },
        },
      });

      store.dispatch(addKind(kind));
      store.dispatch(addCategory(cat1));
      store.dispatch(addCategory(cat2));
      store.dispatch(addImage(image));

      const state = store.getState() as { data: DataStateV2 };
      expect(state.data.relationships.categoryToImages["cat1"]).toContain(
        "img1",
      );
      expect(state.data.relationships.categoryToImages["cat2"]).toContain(
        "img1",
      );
    });

    it("should handle annotation parent-child relationships in link graph", () => {
      const ann1 = createMockAnnotation({ id: "ann1" });
      const ann2 = createMockAnnotation({ id: "ann2" });
      const ann3 = createMockAnnotation({ id: "ann3" });

      store.dispatch(addAnnotation(ann1));
      store.dispatch(addAnnotation(ann2));
      store.dispatch(addAnnotation(ann3));

      // Create a split: ann1 -> ann2, ann3
      const link1 = createMockLinkNode({
        id: "ann1",
        childIds: ["ann2", "ann3"],
        parentIds: [],
      });
      const link2 = createMockLinkNode({
        id: "ann2",
        parentIds: ["ann1"],
        childIds: [],
      });
      const link3 = createMockLinkNode({
        id: "ann3",
        parentIds: ["ann1"],
        childIds: [],
      });

      store.dispatch(addLinkNode(link1));
      store.dispatch(addLinkNode(link2));
      store.dispatch(addLinkNode(link3));

      const state = store.getState() as { data: DataStateV2 };
      expect(state.data.linkGraph["ann1"].childIds).toEqual(["ann2", "ann3"]);
      expect(state.data.linkGraph["ann2"].parentIds).toContain("ann1");
      expect(state.data.linkGraph["ann3"].parentIds).toContain("ann1");
    });
  });
});
