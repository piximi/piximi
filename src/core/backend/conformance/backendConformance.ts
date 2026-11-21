import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { decodeTiff } from "image-js-latest";
import JSZip from "jszip";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Partition,
  UNKNOWN_IMAGE_CATEGORY_ID,
  UNKNOWN_KIND_ID,
  generateCategory,
  generateKind,
  generateUUID,
  representsUnknown,
  UNKNOWN_KIND_CATEGORY_ID,
} from "core/entities";
import { getDefaultModelParams } from "core/dl/classification/utils";
import { AnnotationExportType } from "core/file-io/export/enums";

import { IMAGE_CLASSIFIER_ID } from "store/classifier/constants";

import { hasCapability } from "../capabilities";
import { featureColumn, intensityColumn } from "../measurements/columns";
import { randomKey } from "../query";

import type { ExportedAnnotation } from "core/file-io/export/types";

import type { BackendEvent } from "../events";
import type {
  AnnotationChangeSet,
  Backend,
  ChannelDisplay,
  DimensionConfig,
  ExportedFile,
  ImageRecord,
  RenderRequest,
  UploadFile,
} from "../types";

/* The engine's TIFF fixtures (`tests/vectors/gen_ingest.py`), shared so an
 * upload is checked against the same bytes on every backend. */
const TIFF_FIXTURES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../python/packages/piximi-engine/tests/vectors/tiff",
);

const uploadFixture = (name: string): UploadFile => {
  const bytes = readFileSync(path.join(TIFF_FIXTURES, name));
  return {
    name,
    data: bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ),
  };
};

type ConformanceImage = {
  id: string;
  name: string;
  width: number;
  height: number;
  channelIds: string[];
};

type ConformanceContext = {
  backend: Backend;
  /* Every image the backend holds, in insertion order and with distinct
   * names, so listings can be checked for completeness and order. */
  images: ConformanceImage[];
  /* For `ingest.paths`: the backend's only root, holding a `stacks` folder
   * with `pages6.tif`, `pages12.tif` and `garbage.bin` (not imported). */
  serverFiles?: { root: string };
  teardown?: () => Promise<void> | void;
};

const display = (channelIds: string[]): ChannelDisplay[] =>
  channelIds.map((channelId, i) => ({
    channelId,
    colorMap: [i === 0 ? 1 : 0, i === 1 ? 1 : 0, i >= 2 ? 1 : 0],
    rampMin: 0,
    rampMax: 255,
    visible: true,
  }));

const renderRequest = (image: ConformanceImage): RenderRequest => ({
  channels: display(image.channelIds),
});

const collect = async <T>(iterable: AsyncIterable<T>): Promise<T[]> => {
  const out: T[] = [];
  for await (const item of iterable) out.push(item);
  return out;
};

/*
 * The behaviour every Backend implementation must share, run against each of
 * them. Anything a hook or the sync layer relies on belongs here, so a
 * backend that passes can stand in for any other.
 */
export const describeBackendConformance = (
  name: string,
  setup: () => Promise<ConformanceContext>,
) => {
  describe(`${name}: Backend conformance`, () => {
    let ctx: ConformanceContext;

    beforeAll(async () => {
      ctx = await setup();
      await ctx.backend.connect();
    });

    afterAll(async () => {
      await ctx.backend.dispose();
      await ctx.teardown?.();
    });

    describe("session", () => {
      it("declares its kind, session and capabilities", () => {
        const { backend } = ctx;
        expect(["local", "remote"]).toContain(backend.kind);
        expect(backend.session.id).toBeTruthy();
        expect(backend.session.protocolVersion).toBeTruthy();
        expect(Array.isArray(backend.capabilities)).toBe(true);
      });

      it("exposes optional domains exactly when their capability is declared", () => {
        const { backend } = ctx;
        expect(backend.segmentation !== undefined).toBe(
          hasCapability(backend.capabilities, "segmentation"),
        );
        expect(backend.classification !== undefined).toBe(
          hasCapability(backend.capabilities, "classification"),
        );
        expect(typeof backend.render.raw === "function").toBe(
          hasCapability(backend.capabilities, "raw-local"),
        );
        expect(
          typeof backend.classification?.importFromUrl === "function",
        ).toBe(
          hasCapability(backend.capabilities, "classification.import-url"),
        );
        expect(backend.measurements !== undefined).toBe(
          hasCapability(backend.capabilities, "measurements"),
        );
        expect(backend.ingest !== undefined).toBe(
          hasCapability(backend.capabilities, "ingest.upload"),
        );
        expect(typeof backend.ingest?.browse === "function").toBe(
          hasCapability(backend.capabilities, "ingest.paths"),
        );
        expect(typeof backend.ingest?.addPaths === "function").toBe(
          hasCapability(backend.capabilities, "ingest.paths"),
        );
        expect(backend.export !== undefined).toBe(
          hasCapability(backend.capabilities, "export.annotations"),
        );
      });
    });

    describe("query", () => {
      it("summarises the project with counts that match its contents", async () => {
        const summary = await ctx.backend.query.project();
        expect(summary.counts.images).toBe(ctx.images.length);
        expect(summary.kinds.length).toBeGreaterThan(0);
        expect(summary.experiment.id).toBeTruthy();
      });

      it("pages images by offset without gaps or duplicates", async () => {
        const seen: string[] = [];
        for (let offset = 0; ; ) {
          const page = await ctx.backend.query.images({}, { offset, limit: 1 });
          expect(page.total).toBe(ctx.images.length);
          expect(page.items.length).toBeLessThanOrEqual(1);
          seen.push(...page.items.map((r) => r.image.id));
          offset += page.items.length;
          if (page.items.length === 0 || offset >= page.total) break;
        }
        expect(seen).toEqual(ctx.images.map((im) => im.id));
        const past = await ctx.backend.query.images(
          {},
          { offset: ctx.images.length, limit: 5 },
        );
        expect(past).toEqual({ items: [], total: ctx.images.length });
      });

      it("returns each image with its planes and channels", async () => {
        const [first] = ctx.images;
        const page = await ctx.backend.query.images(
          { ids: [first.id] },
          { limit: 10 },
        );
        expect(page.total).toBe(1);
        const [record] = page.items;
        expect(record.image.id).toBe(first.id);
        expect(record.planes.length).toBeGreaterThan(0);
        expect(record.channels.map((c) => c.id).sort()).toEqual(
          [...first.channelIds].sort(),
        );
      });

      it("filters by ids in insertion order and ignores unknown ones", async () => {
        const [a, b] = ctx.images;
        const page = await ctx.backend.query.images(
          { ids: [b.id, "no-such-image", a.id] },
          { limit: 10 },
        );
        expect(page.items.map((r) => r.image.id)).toEqual([a.id, b.id]);
        expect(page.total).toBe(2);
        expect(await ctx.backend.query.imageIds({ ids: [] })).toEqual([]);
      });

      it("sorts by name, case-insensitively, in both directions", async () => {
        const fold = (s: string) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());
        const byName = ctx.images
          .map((im) => im.id)
          .sort((x, y) => {
            const a = fold(ctx.images.find((im) => im.id === x)!.name);
            const b = fold(ctx.images.find((im) => im.id === y)!.name);
            return a < b ? -1 : a > b ? 1 : 0;
          });
        const { query } = ctx.backend;
        expect(await query.imageIds({}, { key: "name" })).toEqual(byName);
        expect(
          await query.imageIds({}, { key: "name", direction: "desc" }),
        ).toEqual([...byName].reverse());
        const page = await query.images({}, { limit: 2 }, { key: "name" });
        expect(page.items.map((r) => r.image.id)).toEqual(byName.slice(0, 2));
      });

      it("shuffles by seed the same way every backend does", async () => {
        const seed = 12345;
        const expected = ctx.images
          .map((im) => im.id)
          .sort((a, b) => randomKey(seed, a) - randomKey(seed, b));
        const { query } = ctx.backend;
        expect(await query.imageIds({}, { key: "random", seed })).toEqual(
          expected,
        );
        expect(await query.imageIds({}, { key: "random", seed })).toEqual(
          expected,
        );
      });

      it("filters and counts by partition", async () => {
        const { query } = ctx.backend;
        const all = ctx.images.length;
        const unassigned = await query.images(
          { partitions: [Partition.Unassigned] },
          { limit: 1 },
        );
        expect(unassigned.total).toBe(all);
        expect(
          (
            await query.images(
              { partitions: [Partition.Training] },
              { limit: 1 },
            )
          ).total,
        ).toBe(0);
        expect(await query.imageCounts({}, "partition")).toEqual({
          total: all,
          groups: { [Partition.Unassigned]: all },
        });
        expect(
          await query.imageCounts({ partitions: [Partition.Training] }),
        ).toEqual({ total: 0 });
      });

      it("counts by category consistently with the listing", async () => {
        const { query } = ctx.backend;
        const counts = await query.imageCounts({}, "category");
        expect(counts.total).toBe(ctx.images.length);
        const summed = Object.values(counts.groups ?? {}).reduce(
          (a, b) => a + b,
          0,
        );
        expect(summed).toBe(ctx.images.length);
        for (const [categoryId, count] of Object.entries(counts.groups ?? {})) {
          const page = await query.images(
            { categoryIds: [categoryId] },
            { limit: 1 },
          );
          expect(page.total).toBe(count);
        }
      });

      it("offers the softmax sort exactly when it can classify", async () => {
        const { backend } = ctx;
        const listing = backend.query.imageIds({}, { key: "softmax" });
        if (hasCapability(backend.capabilities, "classification")) {
          await expect(listing).resolves.toHaveLength(ctx.images.length);
        } else {
          await expect(listing).rejects.toMatchObject({
            code: "NOT_SUPPORTED",
          });
        }
      });
    });

    describe("render", () => {
      it("renders a plane at its full size as a PNG data URL", async () => {
        const [image] = ctx.images;
        const rendered = await ctx.backend.render.image(renderRequest(image));
        expect(rendered.width).toBe(image.width);
        expect(rendered.height).toBe(image.height);
        expect(rendered.dataUrl.startsWith("data:image/png")).toBe(true);
      });

      it("crops to the requested region", async () => {
        const [image] = ctx.images;
        const rendered = await ctx.backend.render.image({
          ...renderRequest(image),
          region: [1, 0, image.width, image.height],
        });
        expect(rendered.width).toBe(image.width - 1);
        expect(rendered.height).toBe(image.height);
      });

      it("yields one thumbnail result per request", async () => {
        const requests = ctx.images.map(renderRequest);
        const results = await collect(ctx.backend.render.thumbnails(requests));
        expect(results.map((r) => r.index).sort()).toEqual(
          requests.map((_, i) => i),
        );
        for (const result of results) {
          expect(result.ok).toBe(true);
          if (result.ok)
            expect(result.image.dataUrl).toContain("data:image/png");
        }
      });

      it("serves raw channel data under raw-local", async () => {
        const { backend } = ctx;
        if (!backend.render.raw) return;
        const [image] = ctx.images;
        const raw = await backend.render.raw(image.channelIds);
        expect(raw.map((r) => r.channelId)).toEqual(image.channelIds);
        for (const channel of raw) {
          expect(channel.width).toBe(image.width);
          expect(channel.height).toBe(image.height);
          expect(channel.data.length).toBe(image.width * image.height);
        }
      });
    });

    describe("segmentation", () => {
      const runRequest = (
        kindName: string,
        imageIds = ctx.images.map((im) => im.id),
      ) => ({
        modelId: "",
        imageIds,
        channelMetaIds: [],
        kindName,
      });

      it("lists at least one model with its policies", async () => {
        const { segmentation } = ctx.backend;
        if (!segmentation) return;
        const models = await segmentation.listModels();
        expect(models.length).toBeGreaterThan(0);
        for (const model of models) {
          expect(model.name).toBeTruthy();
          expect(model.channelPolicy).toBeDefined();
          expect(model.outputPolicy).toBeDefined();
          expect(model.framework).toBeTruthy();
          expect(model.tasks).toContain("segmentation");
          expect(model.modelLoaded).toBe(model.status === "loaded");
        }
      });

      it("loads a model and then reports it loaded", async () => {
        const { segmentation } = ctx.backend;
        if (!segmentation) return;
        const [model] = await segmentation.listModels();
        const progress: number[] = [];
        await segmentation.loadModel(model.name, {
          onProgress: ({ percent }) => progress.push(percent),
        });
        const after = (await segmentation.listModels()).find(
          (m) => m.name === model.name,
        );
        expect(after?.modelLoaded).toBe(true);
        expect(after?.status).toBe("loaded");
      });

      it("emits the annotations it adds and counts them in the summary", async () => {
        const { backend } = ctx;
        if (!backend.segmentation) return;
        const [model] = await backend.segmentation.listModels();
        const events: BackendEvent[] = [];
        const unsubscribe = backend.subscribe((e) => events.push(e));
        const before = (await backend.query.annotations({}, { limit: 1 }))
          .total;

        const summary = await backend.segmentation.run({
          ...runRequest(`Conformance-${Date.now()}`),
          modelId: model.name,
        });
        unsubscribe();

        expect(summary.cancelled).toBe(false);
        expect(summary.added).toBeGreaterThan(0);
        const added = events.filter((e) => e.type === "annotations/didAdd");
        const annotations = added.flatMap((e) => e.annotations);
        const volumes = added.flatMap((e) => e.volumes);
        expect(annotations.length).toBe(summary.added);
        expect(volumes.length).toBe(summary.added);
        expect(events.some((e) => e.type === "kinds/didAdd")).toBe(true);

        const after = (await backend.query.annotations({}, { limit: 1 })).total;
        expect(after).toBe(before + summary.added);
        const masks = await backend.query.masks(annotations.map((a) => a.id));
        for (const annotation of annotations) {
          expect(masks[annotation.id]).toEqual(annotation.encodedMask);
        }

        // The new objects are reachable through every scope the grids use.
        const { query } = backend;
        const [kind] = added.flatMap((e) => e.volumes).map((v) => v.kindId);
        const added_ids = annotations.map((a) => a.id).sort();
        expect((await query.annotationIds({ kindIds: [kind] })).sort()).toEqual(
          added_ids,
        );
        const [first] = ctx.images;
        const onFirst = annotations.filter((a) => a.imageId === first.id);
        const page = await query.annotations(
          { imageIds: [first.id], kindIds: [kind] },
          { limit: 100 },
          { key: "image" },
        );
        expect(page.total).toBe(onFirst.length);
        expect(page.items.every((r) => r.volume.kindId === kind)).toBe(true);
        expect((await query.annotationCounts({}, "kind")).groups?.[kind]).toBe(
          summary.added,
        );
        const annotated = new Set(annotations.map((a) => a.imageId));
        expect(
          (await query.images({ annotated: true }, { limit: 1 })).total,
        ).toBeGreaterThanOrEqual(annotated.size);
        expect(
          (await query.imageCounts({ annotated: false })).total,
        ).toBeLessThanOrEqual(ctx.images.length - annotated.size);
      });

      it("resolves a run cancelled before it starts as cancelled with nothing added", async () => {
        const { backend } = ctx;
        if (!backend.segmentation) return;
        const [model] = await backend.segmentation.listModels();
        const controller = new AbortController();
        controller.abort();
        const summary = await backend.segmentation.run(
          { ...runRequest(`Cancelled-${Date.now()}`), modelId: model.name },
          { signal: controller.signal },
        );
        expect(summary.cancelled).toBe(true);
        expect(summary.added).toBe(0);
      });

      it("records each run as a job that reaches a terminal state", async () => {
        const { backend } = ctx;
        if (!backend.segmentation) return;
        const [model] = await backend.segmentation.listModels();
        const summary = await backend.segmentation.run({
          ...runRequest(`Jobs-${Date.now()}`),
          modelId: model.name,
        });
        const job = (await backend.jobs.list()).find(
          (j) => j.id === summary.jobId,
        );
        expect(job?.kind).toBe("segmentation");
        expect(job?.status).toBe("succeeded");
      });
    });

    describe("categories", () => {
      it("creates, edits and deletes categories, announcing the list", async () => {
        const { backend } = ctx;
        const events: BackendEvent[] = [];
        const unsubscribe = backend.subscribe((e) => events.push(e));
        const category = generateCategory(
          `Conformance-${Date.now()}`,
          "#123456",
          {
            type: "image",
          },
        );

        expect(await backend.categories.create([category])).toEqual([category]);
        expect((await backend.query.project()).categories).toContainEqual(
          category,
        );
        const renamed = await backend.categories.update(category.id, {
          name: "Renamed",
        });
        expect(renamed).toMatchObject({
          id: category.id,
          name: "Renamed",
          color: "#123456",
        });
        // The reserved unknown category is never deleted.
        expect(
          await backend.categories.delete([
            category.id,
            UNKNOWN_IMAGE_CATEGORY_ID,
            "no-such-category",
          ]),
        ).toEqual({ deleted: 1 });
        unsubscribe();

        const remaining = (await backend.query.project()).categories;
        expect(remaining.map((c) => c.id)).not.toContain(category.id);
        expect(remaining.map((c) => c.id)).toContain(UNKNOWN_IMAGE_CATEGORY_ID);
        const lists = events.filter((e) => e.type === "categories/didChange");
        expect(lists.length).toBeGreaterThanOrEqual(3);
        expect(lists[0].categories).toContainEqual(category);
        expect(lists[1].categories).toContainEqual(renamed);
        expect(lists.at(-1)!.categories.map((c) => c.id)).not.toContain(
          category.id,
        );
      });

      it("categorizes images by query, following the partition rules", async () => {
        const { backend } = ctx;
        const [a, b] = ctx.images;
        const category = generateCategory("Cells", "#00ff00", {
          type: "image",
        });
        await backend.categories.create([category]);
        const events: BackendEvent[] = [];
        const unsubscribe = backend.subscribe((e) => events.push(e));

        expect(
          await backend.images.categorize({ ids: [a.id, b.id] }, category.id),
        ).toEqual({ changed: 2 });
        const update = events.find((e) => e.type === "images/didUpdate");
        expect(update?.updates.map((u) => u.id).sort()).toEqual(
          [a.id, b.id].sort(),
        );
        // A hand-made change leaves an unassigned item unassigned.
        expect(
          update?.updates.every(
            (u) =>
              u.categoryId === category.id &&
              u.partition === Partition.Unassigned,
          ),
        ).toBe(true);
        expect(
          (await backend.query.imageCounts({}, "category")).groups?.[
            category.id
          ],
        ).toBe(2);
        const [record] = (
          await backend.query.images({ ids: [a.id] }, { limit: 1 })
        ).items;
        expect(record.image.categoryId).toBe(category.id);
        expect(
          await backend.images.categorize({ ids: [a.id] }, category.id),
        ).toEqual({ changed: 0 });

        // Back to unknown sends an item to inference.
        expect(
          await backend.images.categorize(
            { ids: [a.id] },
            UNKNOWN_IMAGE_CATEGORY_ID,
          ),
        ).toEqual({ changed: 1 });
        expect(
          (
            await backend.query.imageCounts({
              partitions: [Partition.Inference],
            })
          ).total,
        ).toBe(1);

        // Deleting the category returns `b` to unknown, keeping its partition.
        await backend.categories.delete([category.id]);
        unsubscribe();
        expect(
          (await backend.query.imageCounts({ categoryIds: [category.id] }))
            .total,
        ).toBe(0);
        const last = events
          .filter((e) => e.type === "images/didUpdate")
          .at(-1)!;
        expect(last.updates).toContainEqual(
          expect.objectContaining({
            id: b.id,
            categoryId: UNKNOWN_IMAGE_CATEGORY_ID,
            partition: Partition.Unassigned,
          }),
        );
      });

      it("categorizes objects through their volume", async () => {
        const { backend } = ctx;
        if (!backend.segmentation) return;
        const [model] = await backend.segmentation.listModels();
        const kindName = `Categorized-${Date.now()}`;
        const summary = await backend.segmentation.run({
          modelId: model.name,
          imageIds: ctx.images.map((im) => im.id),
          channelMetaIds: [],
          kindName,
        });
        expect(summary.added).toBeGreaterThan(0);
        const kind = (await backend.query.project()).kinds.find(
          (k) => k.name === kindName,
        )!;
        const category = generateCategory("Round", "#0000ff", {
          type: "annotation",
          kindId: kind.id,
        });
        await backend.categories.create([category]);
        const [first] = (
          await backend.query.annotations({ kindIds: [kind.id] }, { limit: 1 })
        ).items;
        const mask = (await backend.query.masks([first.annotation.id]))[
          first.annotation.id
        ];
        const events: BackendEvent[] = [];
        const unsubscribe = backend.subscribe((e) => events.push(e));

        expect(
          await backend.annotations.categorize(
            { ids: [first.annotation.id] },
            category.id,
          ),
        ).toEqual({ changed: 1 });
        unsubscribe();

        const update = events.find((e) => e.type === "annotations/didUpdate");
        expect(update?.volumes).toContainEqual(
          expect.objectContaining({
            id: first.volume.id,
            categoryId: category.id,
            kindId: kind.id,
          }),
        );
        expect(update?.annotations).toContainEqual({
          id: first.annotation.id,
          partition: Partition.Unassigned,
        });
        const { query } = backend;
        expect(
          (await query.annotationCounts({ kindIds: [kind.id] }, "category"))
            .groups?.[category.id],
        ).toBe(1);
        expect(
          await query.annotationIds({ categoryIds: [category.id] }),
        ).toEqual([first.annotation.id]);
        // The rewrite left the mask alone.
        expect(
          (await query.masks([first.annotation.id]))[first.annotation.id],
        ).toEqual(mask);
      });
    });

    describe("measurements", () => {
      /* Objects to table: whatever a segmenter has found, or finds now. */
      const segmentedKind = async (): Promise<string> => {
        const { backend } = ctx;
        const counts = await backend.query.annotationCounts({}, "kind");
        const [existing] = Object.keys(counts.groups ?? {});
        if (existing) return existing;
        const [model] = await backend.segmentation!.listModels();
        await backend.segmentation!.run({
          modelId: model.name,
          imageIds: ctx.images.map((im) => im.id),
          channelMetaIds: [],
          kindName: `Measured-${Date.now()}`,
        });
        const after = await backend.query.annotationCounts({}, "kind");
        return Object.keys(after.groups ?? {})[0];
      };

      it("tables the objects of a kind by column key, paged and filtered", async () => {
        const { backend } = ctx;
        const { measurements, query } = backend;
        if (!measurements || !backend.segmentation) return;
        const kindId = await segmentedKind();
        const [meta] = (await query.project()).channelMetas;
        const [area, mean, none] = [
          featureColumn("area"),
          intensityColumn("mean", meta.id),
          intensityColumn("mean", "no-such-meta"),
        ];
        const scope = { type: "objects" as const, kindId };
        const table = await measurements.table({
          scope,
          columns: [area, mean, none],
        });
        const listed = await query.annotations(
          { kindIds: [kindId] },
          { limit: 1000 },
        );
        expect(table.total).toBe(listed.total);
        expect(table.ids).toHaveLength(listed.total);
        expect(table.ids.length).toBeGreaterThan(0);
        const byId = new Map(listed.items.map((r) => [r.annotation.id, r]));
        const images = new Map(
          (await query.images({}, { limit: 1000 })).items.map((r) => [
            r.image.id,
            r.image,
          ]),
        );
        table.ids.forEach((id, i) => {
          const record = byId.get(id)!;
          expect(record).toBeDefined();
          expect(table.imageIds?.[i]).toBe(record.annotation.imageId);
          expect(table.imageNames[i]).toBe(
            images.get(record.annotation.imageId)!.name,
          );
          expect(table.categoryIds[i]).toBe(record.volume.categoryId);
          expect(table.partitions[i]).toBe(record.annotation.partition);
          expect(table.boundingBoxes?.[i]).toEqual(
            record.annotation.boundingBox,
          );
          const [x0, y0, x1, y1] = record.annotation.boundingBox;
          const value = table.values[area][i];
          expect(value).toBeGreaterThan(0);
          expect(value).toBeLessThanOrEqual((x1 - x0) * (y1 - y0));
          const intensity = table.values[mean][i];
          expect(intensity === null || Number.isFinite(intensity)).toBe(true);
          // A meta no plane has is a column of nothing, not an error.
          expect(table.values[none][i]).toBeNull();
        });

        // A page is a window of the same rows; a query narrows them within the kind.
        const page = await measurements.table({
          scope,
          columns: [area],
          page: { offset: 1, limit: 2 },
        });
        expect(page.total).toBe(table.total);
        expect(page.ids).toEqual(table.ids.slice(1, 3));
        expect(page.values[area]).toEqual(table.values[area].slice(1, 3));
        const [first] = ctx.images;
        const onFirst = await measurements.table({
          scope,
          columns: [area],
          annotationQuery: { imageIds: [first.id] },
        });
        expect(onFirst.ids).toEqual(
          table.ids.filter((_, i) => table.imageIds?.[i] === first.id),
        );
        expect(onFirst.total).toBe(onFirst.ids.length);
        const elsewhere = await measurements.table({
          scope,
          columns: [area],
          annotationQuery: { kindIds: ["some-other-kind"] },
        });
        expect(elsewhere).toMatchObject({
          ids: [],
          total: 0,
          values: { [area]: [] },
        });
      });

      it("measures objects again on demand, as a job, to the same values", async () => {
        const { backend } = ctx;
        const { measurements, jobs, query } = backend;
        if (!measurements || !backend.segmentation) return;
        const kindId = await segmentedKind();
        const [meta] = (await query.project()).channelMetas;
        const columns = [
          featureColumn("area"),
          intensityColumn("mean", meta.id),
        ];
        const scope = { type: "objects" as const, kindId };
        const before = await measurements.table({ scope, columns });
        // Everything a run adds is measured already.
        expect(await measurements.compute({ scope })).toMatchObject({
          measured: 0,
          cancelled: false,
        });
        const again = await measurements.compute({ scope, force: true });
        expect(again).toMatchObject({
          measured: before.ids.length,
          cancelled: false,
        });
        expect(again.jobId).toBeTruthy();
        expect(
          (await jobs.list()).find((job) => job.id === again.jobId),
        ).toMatchObject({
          kind: "measurements",
          status: "succeeded",
        });
        const after = await measurements.table({ scope, columns });
        expect(after.ids).toEqual(before.ids);
        for (const column of columns) {
          after.values[column].forEach((value, i) => {
            const previous = before.values[column][i];
            if (value === null || previous === null)
              expect(value).toBe(previous);
            else expect(value).toBeCloseTo(previous, 6);
          });
        }
        // Cancelled before it starts: nothing measured, no job.
        const controller = new AbortController();
        controller.abort();
        expect(
          await measurements.compute(
            { scope, force: true },
            { signal: controller.signal },
          ),
        ).toEqual({ measured: 0, cancelled: true });
      });

      it("measures the images' channel statistics again on demand", async () => {
        const { backend } = ctx;
        const { measurements, query } = backend;
        if (!measurements) return;
        const [meta] = (await query.project()).channelMetas;
        const column = intensityColumn("mean", meta.id);
        const scope = { type: "images" as const };
        const before = await measurements.table({ scope, columns: [column] });
        // Every image comes with its statistics; a query narrows a forced pass.
        expect(await measurements.compute({ scope })).toMatchObject({
          measured: 0,
          cancelled: false,
        });
        const again = await measurements.compute({ scope, force: true });
        expect(again).toMatchObject({
          measured: before.ids.length,
          cancelled: false,
        });
        const after = await measurements.table({ scope, columns: [column] });
        after.values[column].forEach((value, i) => {
          const previous = before.values[column][i];
          if (value === null || previous === null) expect(value).toBe(previous);
          else expect(value).toBeCloseTo(previous, 6);
        });
        const [first] = ctx.images;
        expect(
          await measurements.compute({
            scope,
            imageQuery: { ids: [first.id] },
            force: true,
          }),
        ).toMatchObject({ measured: 1, cancelled: false });
      });

      it("tables the images' channel statistics and refuses what it cannot measure", async () => {
        const { backend } = ctx;
        const { measurements, query } = backend;
        if (!measurements) return;
        const [meta] = (await query.project()).channelMetas;
        const column = intensityColumn("mean", meta.id);
        const table = await measurements.table({
          scope: { type: "images" },
          columns: [column],
        });
        const listed = (await query.images({}, { limit: 1000 })).items;
        expect(table.total).toBe(listed.length);
        expect(table.ids).toEqual(listed.map((r) => r.image.id));
        expect(table.imageIds).toBeUndefined();
        expect(table.boundingBoxes).toBeUndefined();
        listed.forEach((record, i) => {
          expect(table.imageNames[i]).toBe(record.image.name);
          expect(table.categoryIds[i]).toBe(record.image.categoryId);
          expect(table.partitions[i]).toBe(record.image.partition);
          const channel = record.channels.find(
            (c) =>
              c.planeId === record.image.activePlaneId &&
              c.channelMetaId === meta.id,
          );
          expect(table.values[column][i]).toBe(channel?.mean ?? null);
        });
        const only = await measurements.table({
          scope: { type: "images" },
          columns: [column],
          imageQuery: { ids: [listed[1].image.id] },
        });
        expect(only.ids).toEqual([listed[1].image.id]);
        expect(only.total).toBe(1);

        for (const request of [
          { scope: { type: "images" as const }, columns: ["bogus"] },
          {
            scope: { type: "images" as const },
            columns: [featureColumn("area")],
          },
          {
            scope: { type: "objects" as const },
            columns: [featureColumn("area")],
          },
        ]) {
          await expect(measurements.table(request)).rejects.toMatchObject({
            code: "NOT_SUPPORTED",
          });
        }
      });
    });

    describe("classification", () => {
      it("lists at least one architecture that can be trained", async () => {
        const { classification } = ctx.backend;
        if (!classification) return;
        const architectures = await classification.listArchitectures();
        expect(architectures.length).toBeGreaterThan(0);
        for (const model of architectures) {
          expect(model.name).toBeTruthy();
          expect(model.framework).toBeTruthy();
          expect(model.channelPolicy).toBeDefined();
          expect(model.tasks.some((t) => t.startsWith("classification"))).toBe(
            true,
          );
        }
        expect(
          architectures.some((m) => m.tasks.includes("classification.train")),
        ).toBe(hasCapability(ctx.backend.capabilities, "classification.train"));
      });

      it("trains on labeled images, predicts the rest, and keeps the record", async () => {
        const { backend } = ctx;
        const { classification, query } = backend;
        if (!classification) return;
        if (!hasCapability(backend.capabilities, "classification.train"))
          return;
        // Two per category so each can both train and validate at a half split.
        expect(ctx.images.length).toBeGreaterThanOrEqual(5);
        const [a, b, c, d, e] = ctx.images;
        const [first, second] = await backend.categories.create([
          generateCategory("First", "#ff0000", { type: "image" }),
          generateCategory("Second", "#00ff00", { type: "image" }),
        ]);
        await backend.images.categorize({ ids: [a.id, b.id] }, first.id);
        await backend.images.categorize({ ids: [c.id, d.id] }, second.id);
        const [architecture] = (
          await classification.listArchitectures()
        ).filter((m) => m.tasks.includes("classification.train"));
        const defaults = getDefaultModelParams();
        const events: BackendEvent[] = [];
        const unsubscribe = backend.subscribe((event) => events.push(event));

        const created = await classification.create({
          targetId: IMAGE_CLASSIFIER_ID,
          name: `Conformance-${Date.now()}`,
          architectureId: architecture.name,
          hyperparameters: {
            preprocess: {
              ...defaults.preprocessSettings,
              trainingPercentage: 0.5,
              shuffle: true,
            },
            optimizer: {
              ...defaults.optimizerSettings,
              epochs: 2,
              batchSize: 2,
            },
          },
          seed: 7,
        });
        expect(created).toMatchObject({
          targetId: IMAGE_CLASSIFIER_ID,
          architectureId: architecture.name,
          trained: false,
          runs: [],
        });
        expect(await classification.list()).toContainEqual(
          expect.objectContaining({ id: created.id }),
        );

        const fit = await classification.fit({
          classifierId: created.id,
          seed: 7,
        });
        expect(fit.status).toBe("completed");
        expect(fit.runId).toBeTruthy();
        expect(fit.evalResults?.accuracy).toBeGreaterThanOrEqual(0);
        // Each epoch is announced, and the record ends up trained.
        const epochs = events.filter(
          (ev) => ev.type === "classifiers/didEpoch",
        );
        expect(epochs).toHaveLength(2);
        expect(epochs.every((ev) => ev.runId === fit.runId)).toBe(true);
        const trained = (await classification.list()).find(
          (cl) => cl.id === created.id,
        )!;
        expect(trained.trained).toBe(true);
        expect(trained.busy).toBeUndefined();
        expect(Object.values(trained.classMap ?? {}).sort()).toEqual(
          [first.id, second.id].sort(),
        );
        const run = trained.runs.at(-1)!;
        expect(run).toMatchObject({ id: fit.runId, status: "completed" });
        expect(run.history).toHaveLength(2);
        expect(run.evalResults).toEqual(fit.evalResults);
        expect(
          events
            .filter((ev) => ev.type === "classifiers/didChange")
            .at(-1)
            ?.classifiers.find((cl) => cl.id === created.id)
            ?.runs.at(-1)?.status,
        ).toBe("completed");
        // The split placed the labeled items; the unlabeled one waits.
        expect(await query.imageCounts({}, "partition")).toEqual({
          total: 5,
          groups: {
            [Partition.Training]: 2,
            [Partition.Validation]: 2,
            [Partition.Inference]: 1,
          },
        });

        const predicted = await classification.predict({
          classifierId: created.id,
        });
        expect(predicted).toMatchObject({ predicted: 1, cancelled: false });
        const after = (await query.images({ ids: [e.id] }, { limit: 1 }))
          .items[0].image;
        expect(representsUnknown(after.categoryId)).toBe(false);
        expect(after.partition).toBe(Partition.Inference);
        expect(after.predictedAtRunId).toBe(fit.runId);
        expect(after.predictionConfidence).toBeGreaterThan(0);
        expect(await query.imageIds({}, { key: "softmax" })).toHaveLength(5);

        // Clearing returns it to unknown; predicting again and accepting keeps it.
        expect(
          await classification.clearPredictions(IMAGE_CLASSIFIER_ID),
        ).toEqual({ changed: 1 });
        const cleared = (await query.images({ ids: [e.id] }, { limit: 1 }))
          .items[0].image;
        expect(representsUnknown(cleared.categoryId)).toBe(true);
        expect(cleared.partition).toBe(Partition.Inference);
        await classification.predict({ classifierId: created.id });
        expect(
          await classification.acceptPredictions(IMAGE_CLASSIFIER_ID),
        ).toEqual({ changed: 1 });
        const accepted = (await query.images({ ids: [e.id] }, { limit: 1 }))
          .items[0].image;
        expect(representsUnknown(accepted.categoryId)).toBe(false);
        expect(accepted.partition).toBe(Partition.Unassigned);

        expect((await classification.evaluate(created.id)).accuracy).toBe(
          fit.evalResults?.accuracy,
        );
        unsubscribe();

        await classification.delete(created.id);
        expect(
          (await classification.list()).some((cl) => cl.id === created.id),
        ).toBe(false);
        await backend.categories.delete([first.id, second.id]);
      });

      it("invalidates trained classifiers when the categories change", async () => {
        const { backend } = ctx;
        const { classification } = backend;
        if (!classification) return;
        if (!hasCapability(backend.capabilities, "classification.train"))
          return;
        const [a, b, c, d] = ctx.images;
        const [first, second] = await backend.categories.create([
          generateCategory("First", "#ff0000", { type: "image" }),
          generateCategory("Second", "#00ff00", { type: "image" }),
        ]);
        await backend.images.categorize({ ids: [a.id, b.id] }, first.id);
        await backend.images.categorize({ ids: [c.id, d.id] }, second.id);
        const [architecture] = (
          await classification.listArchitectures()
        ).filter((m) => m.tasks.includes("classification.train"));
        const defaults = getDefaultModelParams();
        const create = (name: string) =>
          classification.create({
            targetId: IMAGE_CLASSIFIER_ID,
            name: `${name}-${Date.now()}`,
            architectureId: architecture.name,
            hyperparameters: {
              preprocess: {
                ...defaults.preprocessSettings,
                trainingPercentage: 0.5,
                shuffle: true,
              },
              optimizer: {
                ...defaults.optimizerSettings,
                epochs: 1,
                batchSize: 2,
              },
            },
            seed: 7,
          });
        const trained = await create("Stale");
        const spare = await create("Spare");
        const valid = async (id: string) =>
          (await classification.list()).find((cl) => cl.id === id)!.valid;

        const fit = await classification.fit({
          classifierId: trained.id,
          seed: 7,
        });
        expect(fit.status).toBe("completed");
        // Renaming a category changes nothing...
        await backend.categories.update(first.id, { name: "Primary" });
        expect(await valid(trained.id)).toBe(true);
        // ...adding one invalidates the classifiers that have run, which
        // refuse to continue, while an untrained one keeps following along.
        const [third] = await backend.categories.create([
          generateCategory("Third", "#0000ff", { type: "image" }),
        ]);
        expect(await valid(trained.id)).toBe(false);
        expect(await valid(spare.id)).toBe(true);
        await expect(
          classification.fit({ classifierId: trained.id }),
        ).rejects.toMatchObject({ code: "TRAINING_FAILED" });
        // Predicting among the classes it knows still works, until one of
        // them is deleted and a prediction could dangle.
        const predicted = await classification.predict({
          classifierId: trained.id,
        });
        expect(predicted.cancelled).toBe(false);
        expect(predicted.predicted).toBeGreaterThan(0);
        await classification.clearPredictions(IMAGE_CLASSIFIER_ID);
        await backend.categories.delete([second.id]);
        await expect(
          classification.predict({ classifierId: trained.id }),
        ).rejects.toMatchObject({ code: "PREDICTION_FAILED" });

        await classification.delete(trained.id);
        await classification.delete(spare.id);
        await backend.categories.delete([first.id, third.id]);
      });

      it("resolves a fit cancelled before it starts without a run", async () => {
        const { classification } = ctx.backend;
        if (!classification) return;
        if (!hasCapability(ctx.backend.capabilities, "classification.train"))
          return;
        const [architecture] = await classification.listArchitectures();
        const defaults = getDefaultModelParams();
        const created = await classification.create({
          targetId: IMAGE_CLASSIFIER_ID,
          name: `Cancelled-${Date.now()}`,
          architectureId: architecture.name,
          hyperparameters: {
            preprocess: defaults.preprocessSettings,
            optimizer: defaults.optimizerSettings,
          },
        });
        const controller = new AbortController();
        controller.abort();
        expect(
          await classification.fit(
            { classifierId: created.id },
            { signal: controller.signal },
          ),
        ).toEqual({ status: "stopped" });
        await classification.delete(created.id);
      });
    });

    // Last, since it removes from the project the earlier blocks count.
    describe("editing", () => {
      const empty = (): AnnotationChangeSet => ({
        imageIds: [],
        volumes: { created: [], updated: [], deleted: [] },
        annotations: { created: [], updated: [], deleted: [] },
      });
      const changes = (
        imageIds: string[],
        partial: {
          volumes?: Partial<AnnotationChangeSet["volumes"]>;
          annotations?: Partial<AnnotationChangeSet["annotations"]>;
          force?: boolean;
        },
      ): AnnotationChangeSet => {
        const base = empty();
        return {
          imageIds,
          volumes: { ...base.volumes, ...partial.volumes },
          annotations: { ...base.annotations, ...partial.annotations },
          ...(partial.force !== undefined && { force: partial.force }),
        };
      };
      const record = async (backend: Backend, id: string) =>
        (await backend.query.annotations({ ids: [id] }, { limit: 1 })).items[0];

      it("commits a session's objects: made, redrawn, recategorized, deleted", async () => {
        const { backend } = ctx;
        const image = ctx.images[0];
        const [imageRecord] = (
          await backend.query.images({ ids: [image.id] }, { limit: 1 })
        ).items;
        const plane = imageRecord.planes[0];
        const { kind, unknownCategory } = generateKind(`Edited-${Date.now()}`);
        await backend.kinds.create([{ kind, category: unknownCategory }]);
        const [round] = await backend.categories.create([
          generateCategory("Round", "#00ff00", {
            type: "annotation",
            kindId: kind.id,
          }),
        ]);
        const events: BackendEvent[] = [];
        const unsubscribe = backend.subscribe((e) => events.push(e));
        const volume = {
          id: generateUUID(),
          imageId: image.id,
          kindId: kind.id,
          categoryId: unknownCategory.id,
        };
        const annotation = {
          id: generateUUID(),
          planeId: plane.id,
          imageId: image.id,
          volumeId: volume.id,
          partition: Partition.Unassigned,
          shape: { planes: 1, height: 2, width: 2, channels: 1 },
          boundingBox: [0, 0, 2, 2] as [number, number, number, number],
          encodedMask: [0, 4],
        };

        // Made: stored with its mask, measured, announced.
        const made = await backend.annotations.commit(
          changes([image.id], {
            volumes: { created: [volume] },
            annotations: { created: [annotation] },
          }),
        );
        expect(made).toEqual({
          created: 1,
          updated: 0,
          deleted: 0,
          conflicts: [],
        });
        const added = events.find((e) => e.type === "annotations/didAdd");
        expect(
          added?.type === "annotations/didAdd" && added.volumes[0].id,
        ).toBe(volume.id);
        expect(
          added?.type === "annotations/didAdd" &&
            added.annotations[0].features?.area,
        ).toBe(4);
        let current = await record(backend, annotation.id);
        expect(current.annotation.features?.area).toBe(4);
        expect(
          Object.keys(current.annotation.intensityMeasurements ?? {}).length,
        ).toBeGreaterThan(0);
        expect(await backend.query.masks([annotation.id])).toEqual({
          [annotation.id]: [0, 4],
        });

        // Redrawn: new box and mask, measured again, announced as a header.
        const redrawn = await backend.annotations.commit(
          changes([image.id], {
            annotations: {
              updated: [
                {
                  id: annotation.id,
                  baseRev: current.annotation.rev,
                  boundingBox: [0, 0, 3, 2],
                  encodedMask: [0, 6],
                },
              ],
            },
          }),
        );
        expect(redrawn).toMatchObject({ updated: 1, conflicts: [] });
        const updated = events.find((e) => e.type === "annotations/didUpdate");
        expect(
          updated?.type === "annotations/didUpdate" &&
            updated.headers?.[0].boundingBox,
        ).toEqual([0, 0, 3, 2]);
        current = await record(backend, annotation.id);
        expect(current.annotation.boundingBox).toEqual([0, 0, 3, 2]);
        expect(current.annotation.features?.area).toBe(6);
        expect(current.annotation.shape.width).toBe(3);

        // Recategorized through the volume; the kind's count follows.
        const moved = await backend.annotations.commit(
          changes([image.id], {
            volumes: {
              updated: [
                {
                  id: volume.id,
                  baseRev: current.volume.rev,
                  categoryId: round.id,
                },
              ],
            },
          }),
        );
        expect(moved).toMatchObject({ updated: 1, conflicts: [] });
        current = await record(backend, annotation.id);
        expect(current.volume.categoryId).toBe(round.id);
        expect(
          (await backend.query.annotationCounts({ categoryIds: [round.id] }))
            .total,
        ).toBe(1);

        // A row read at a revision that has since moved is refused as a
        // whole, and applied when forced; a row that is gone is missing.
        if (current.annotation.rev !== undefined) {
          const stale = changes([image.id], {
            annotations: {
              updated: [
                {
                  id: annotation.id,
                  baseRev: current.annotation.rev - 1,
                  boundingBox: [0, 0, 2, 2],
                  encodedMask: [0, 4],
                },
              ],
              deleted: [{ id: "nope", baseRev: 1 }],
            },
          });
          const refused = await backend.annotations.commit(stale);
          expect(refused).toMatchObject({ created: 0, updated: 0, deleted: 0 });
          expect(refused.conflicts).toEqual(
            expect.arrayContaining([
              { type: "annotation", id: annotation.id, reason: "modified" },
              { type: "annotation", id: "nope", reason: "missing" },
            ]),
          );
          expect(
            (await record(backend, annotation.id)).annotation.boundingBox,
          ).toEqual([0, 0, 3, 2]);
          const forced = await backend.annotations.commit({
            ...stale,
            force: true,
          });
          expect(forced).toMatchObject({ updated: 1, deleted: 0 });
          expect(forced.conflicts).toEqual([
            { type: "annotation", id: "nope", reason: "missing" },
          ]);
          current = await record(backend, annotation.id);
          expect(current.annotation.boundingBox).toEqual([0, 0, 2, 2]);
        } else {
          const missing = await backend.annotations.commit(
            changes([image.id], {
              annotations: { deleted: [{ id: "nope" }] },
            }),
          );
          expect(missing.conflicts).toEqual([
            { type: "annotation", id: "nope", reason: "missing" },
          ]);
        }

        // Deleted, taking its emptied volume along.
        const deleted = await backend.annotations.commit(
          changes([image.id], {
            volumes: {
              deleted: [{ id: volume.id, baseRev: current.volume.rev }],
            },
            annotations: {
              deleted: [{ id: annotation.id, baseRev: current.annotation.rev }],
            },
          }),
        );
        unsubscribe();
        expect(deleted).toMatchObject({ deleted: 1, conflicts: [] });
        const removed = events.find((e) => e.type === "annotations/didRemove");
        expect(
          removed?.type === "annotations/didRemove" && removed.volumeIds,
        ).toEqual([volume.id]);
        expect(
          (await backend.query.annotationCounts({ ids: [annotation.id] }))
            .total,
        ).toBe(0);
        await backend.kinds.delete([kind.id]);
      });

      it("refuses a changeset that names what does not exist or fit", async () => {
        const { backend } = ctx;
        const image = ctx.images[0];
        const [imageRecord] = (
          await backend.query.images({ ids: [image.id] }, { limit: 1 })
        ).items;
        const { kind, unknownCategory } = generateKind(`Bad-${Date.now()}`);
        await backend.kinds.create([{ kind, category: unknownCategory }]);
        const volume = {
          id: generateUUID(),
          imageId: image.id,
          kindId: kind.id,
          categoryId: unknownCategory.id,
        };
        const annotation = {
          id: generateUUID(),
          planeId: imageRecord.planes[0].id,
          imageId: image.id,
          volumeId: volume.id,
          partition: Partition.Unassigned,
          shape: { planes: 1, height: 2, width: 2, channels: 1 },
          boundingBox: [0, 0, 2, 2] as [number, number, number, number],
          encodedMask: [0, 3],
        };
        await expect(
          backend.annotations.commit(changes(["nope"], {})),
        ).rejects.toMatchObject({ name: "BackendError" });
        await expect(
          backend.annotations.commit(
            changes([image.id], {
              volumes: { created: [volume] },
              annotations: { created: [annotation] },
            }),
          ),
        ).rejects.toMatchObject({ name: "BackendError" });
        expect(
          (await backend.query.annotationCounts({ ids: [annotation.id] }))
            .total,
        ).toBe(0);
        await backend.kinds.delete([kind.id]);
      });

      it("creates, renames and deletes kinds, moving their objects to unknown", async () => {
        const { backend } = ctx;
        const image = ctx.images[1];
        const [imageRecord] = (
          await backend.query.images({ ids: [image.id] }, { limit: 1 })
        ).items;
        const name = `Kind-${Date.now()}`;
        const { kind, unknownCategory } = generateKind(name);
        const events: BackendEvent[] = [];
        const unsubscribe = backend.subscribe((e) => events.push(e));

        expect(
          await backend.kinds.create([{ kind, category: unknownCategory }]),
        ).toEqual([kind]);
        expect(events.at(-1)?.type).toBe("kinds/didAdd");
        expect(
          (await backend.query.project()).kinds.some((k) => k.id === kind.id),
        ).toBe(true);
        await expect(
          backend.kinds.create([{ kind, category: unknownCategory }]),
        ).rejects.toMatchObject({ name: "BackendError" });

        const renamed = await backend.kinds.update(kind.id, `${name}-renamed`);
        expect(renamed.name).toBe(`${name}-renamed`);
        const change = events.at(-1);
        expect(
          change?.type === "kinds/didChange" &&
            change.kinds.find((k) => k.id === kind.id)?.name,
        ).toBe(`${name}-renamed`);
        await expect(
          backend.kinds.update(UNKNOWN_KIND_ID, "Other"),
        ).rejects.toMatchObject({ name: "BackendError" });

        const volume = {
          id: generateUUID(),
          imageId: image.id,
          kindId: kind.id,
          categoryId: unknownCategory.id,
        };
        const annotation = {
          id: generateUUID(),
          planeId: imageRecord.planes[0].id,
          imageId: image.id,
          volumeId: volume.id,
          partition: Partition.Unassigned,
          shape: { planes: 1, height: 2, width: 2, channels: 1 },
          boundingBox: [0, 0, 2, 2] as [number, number, number, number],
          encodedMask: [0, 4],
        };
        await backend.annotations.commit(
          changes([image.id], {
            volumes: { created: [volume] },
            annotations: { created: [annotation] },
          }),
        );
        const unknownBefore = (
          await backend.query.annotationCounts({ kindIds: [UNKNOWN_KIND_ID] })
        ).total;

        expect(await backend.kinds.delete([kind.id, UNKNOWN_KIND_ID])).toEqual({
          deleted: 1,
        });
        unsubscribe();
        const types = events.map((e) => e.type);
        expect(types.at(-1)).toBe("kinds/didRemove");
        expect(types).toContain("annotations/didUpdate");
        expect(types).toContain("categories/didChange");
        const summary = await backend.query.project();
        expect(summary.kinds.some((k) => k.id === kind.id)).toBe(false);
        expect(
          summary.categories.some(
            (c) => c.type === "annotation" && c.kindId === kind.id,
          ),
        ).toBe(false);
        expect(
          (await backend.query.annotationCounts({ kindIds: [UNKNOWN_KIND_ID] }))
            .total,
        ).toBe(unknownBefore + 1);
        expect((await record(backend, annotation.id)).volume.kindId).toBe(
          UNKNOWN_KIND_ID,
        );
        await backend.annotations.delete({ ids: [annotation.id] });
      });

      it("updates images, annotation partitions and the project name", async () => {
        const { backend } = ctx;
        const image = ctx.images[2];
        const [imageRecord] = (
          await backend.query.images({ ids: [image.id] }, { limit: 1 })
        ).items;
        const events: BackendEvent[] = [];
        const unsubscribe = backend.subscribe((e) => events.push(e));

        const [renamed] = await backend.images.update([
          {
            id: image.id,
            name: `${image.name}-renamed`,
            partition: Partition.Training,
          },
        ]);
        expect(renamed.name).toBe(`${image.name}-renamed`);
        expect(renamed.partition).toBe(Partition.Training);
        expect(events.at(-1)?.type).toBe("images/didChange");
        expect(
          (await backend.query.images({ ids: [image.id] }, { limit: 1 }))
            .items[0].image.name,
        ).toBe(`${image.name}-renamed`);
        await expect(
          backend.images.update([{ id: image.id, activePlaneId: "nope" }]),
        ).rejects.toMatchObject({ name: "BackendError" });
        await backend.images.update([
          { id: image.id, name: image.name, partition: Partition.Unassigned },
        ]);

        const { kind, unknownCategory } = generateKind(`Part-${Date.now()}`);
        await backend.kinds.create([{ kind, category: unknownCategory }]);
        const volume = {
          id: generateUUID(),
          imageId: image.id,
          kindId: kind.id,
          categoryId: unknownCategory.id,
        };
        const annotation = {
          id: generateUUID(),
          planeId: imageRecord.planes[0].id,
          imageId: image.id,
          volumeId: volume.id,
          partition: Partition.Unassigned,
          shape: { planes: 1, height: 2, width: 2, channels: 1 },
          boundingBox: [0, 0, 2, 2] as [number, number, number, number],
          encodedMask: [0, 4],
        };
        await backend.annotations.commit(
          changes([image.id], {
            volumes: { created: [volume] },
            annotations: { created: [annotation] },
          }),
        );
        expect(
          await backend.annotations.update([
            { id: annotation.id, partition: Partition.Validation },
          ]),
        ).toEqual({ changed: 1 });
        expect(
          (await record(backend, annotation.id)).annotation.partition,
        ).toBe(Partition.Validation);
        expect(
          await backend.annotations.update([
            { id: annotation.id, partition: Partition.Validation },
          ]),
        ).toEqual({ changed: 0 });

        const before = (await backend.query.project()).experiment.name;
        expect((await backend.project.rename("Renamed project")).name).toBe(
          "Renamed project",
        );
        expect(events.at(-1)?.type).toBe("project/didChange");
        expect((await backend.query.project()).experiment.name).toBe(
          "Renamed project",
        );
        await backend.project.rename(before);
        unsubscribe();
        await backend.kinds.delete([kind.id]);
        await backend.annotations.delete({ ids: [annotation.id] });
      });
    });

    describe("ingest", () => {
      /*
       * The fixture stacks are flat: N 4x4 uint16 pages, page k holding
       * the constant (k + 1) * 100, so a channel's min value says which
       * page it came from. The project's channel count decides which
       * stack fits.
       */
      const pageValue = (k: number) => (k + 1) * 100;
      const channelCount = async (): Promise<number> =>
        (await ctx.backend.query.project()).experiment.channels ??
        ctx.images[0].channelIds.length;
      /* Channel meta ids in index order, as the project lists them. */
      const metaIndex = async (): Promise<Map<string, number>> =>
        new Map(
          (await ctx.backend.query.project()).channelMetas.map((meta, i) => [
            meta.id,
            i,
          ]),
        );
      const collectAdded = () => {
        const events: Extract<BackendEvent, { type: "images/didAdd" }>[] = [];
        const unsubscribe = ctx.backend.subscribe((event) => {
          if (event.type === "images/didAdd") events.push(event);
        });
        return { events, unsubscribe };
      };
      const cleanUp = async (imageIds: string[]) => {
        if (imageIds.length > 0)
          await ctx.backend.images.delete({ ids: imageIds });
      };
      /* Page (z, c) of a stack, by the config's order. */
      const valueAt = (
        config: DimensionConfig,
        z: number,
        c: number,
        t = 0,
      ): number =>
        pageValue(
          config.dimensionOrder === "xyzct"
            ? z + c * config.slices + t * config.slices * config.channels
            : c + z * config.channels + t * config.channels * config.slices,
        );
      const checkStack = async (
        record: ImageRecord,
        config: DimensionConfig,
        t = 0,
      ) => {
        const metas = await metaIndex();
        const zOf = new Map(
          record.planes.map((plane) => [plane.id, plane.zIndex]),
        );
        expect(record.image.shape.planes).toBe(config.slices);
        expect(record.image.shape.channels).toBe(config.channels);
        expect(record.channels).toHaveLength(config.slices * config.channels);
        for (const channel of record.channels) {
          const z = zOf.get(channel.planeId)!;
          const c = metas.get(channel.channelMetaId)!;
          expect(channel.minValue).toBe(valueAt(config, z, c, t));
          expect(channel.maxValue).toBe(valueAt(config, z, c, t));
        }
      };

      it("adds a single-page stack and reports an undecodable file alone", async () => {
        const { backend } = ctx;
        if (!backend.ingest) return;
        const channels = await channelCount();
        const before = (await backend.query.images({}, { limit: 1 })).total;
        const { events, unsubscribe } = collectAdded();
        const config: DimensionConfig = {
          dimensionOrder: "xyczt",
          channels,
          slices: 1,
          frames: 1,
        };
        const summary = await backend.ingest.upload([
          { ...uploadFixture(`pages${channels}.tif`), dimensionConfig: config },
          uploadFixture("garbage.bin"),
        ]);
        unsubscribe();
        try {
          expect(summary.cancelled).toBe(false);
          expect(summary.jobId).toBeTruthy();
          expect(summary.imageIds).toHaveLength(1);
          expect(summary.failed.map((f) => f.name)).toEqual(["garbage.bin"]);
          expect(summary.failed[0].error).toBeTruthy();
          expect(events).toHaveLength(1);
          const [record] = events[0].records;
          expect(record.image.id).toBe(summary.imageIds[0]);
          expect(record.image.name).toBe(`pages${channels}`);
          expect(record.image.shape).toEqual({
            planes: 1,
            height: 4,
            width: 4,
            channels,
          });
          expect(record.image.bitDepth).toBe(16);
          await checkStack(record, config);
          const listed = await backend.query.images(
            { ids: summary.imageIds },
            { limit: 10 },
          );
          expect(listed.items.map((r) => r.image.id)).toEqual(summary.imageIds);
          expect((await backend.query.images({}, { limit: 1 })).total).toBe(
            before + 1,
          );
          const job = (await backend.jobs.list()).find(
            (j) => j.id === summary.jobId,
          );
          expect(job?.status).toBe("succeeded");
        } finally {
          await cleanUp(summary.imageIds);
        }
      });

      it("splits a stack into planes and channels by the dimension order", async () => {
        const { backend } = ctx;
        if (!backend.ingest) return;
        const channels = await channelCount();
        // Pages per fixture that the channel count divides into whole slices.
        const pages = { 1: 3, 2: 6, 3: 12 }[channels] ?? 12;
        const slices = pages / channels;
        for (const dimensionOrder of ["xyzct", "xyczt"] as const) {
          const config: DimensionConfig = {
            dimensionOrder,
            channels,
            slices,
            frames: 1,
          };
          const { events, unsubscribe } = collectAdded();
          const summary = await backend.ingest.upload([
            { ...uploadFixture(`pages${pages}.tif`), dimensionConfig: config },
          ]);
          unsubscribe();
          try {
            expect(summary.failed).toEqual([]);
            expect(summary.imageIds).toHaveLength(1);
            expect(events).toHaveLength(1);
            const [record] = events[0].records;
            await checkStack(record, config);
            // The middle plane is the active one.
            const middle = record.planes.find(
              (plane) => plane.zIndex === Math.floor(slices / 2),
            )!;
            expect(record.image.activePlaneId).toBe(middle.id);
          } finally {
            await cleanUp(summary.imageIds);
          }
        }
      });

      it("makes one image per time frame, in one series", async () => {
        const { backend } = ctx;
        if (!backend.ingest) return;
        const channels = await channelCount();
        const [pages, slices, frames] = {
          1: [6, 3, 2],
          2: [12, 2, 3],
          3: [12, 2, 2],
        }[channels] ?? [12, 1, 1];
        const config: DimensionConfig = {
          dimensionOrder: "xyczt",
          channels,
          slices,
          frames,
        };
        const { events, unsubscribe } = collectAdded();
        const summary = await backend.ingest.upload([
          { ...uploadFixture(`pages${pages}.tif`), dimensionConfig: config },
        ]);
        unsubscribe();
        try {
          expect(summary.failed).toEqual([]);
          expect(summary.imageIds).toHaveLength(frames);
          const records = events.flatMap((event) => event.records);
          expect(records).toHaveLength(frames);
          expect(new Set(records.map((r) => r.series.id)).size).toBe(1);
          expect(records[0].series.timeSeries).toBe(true);
          expect(records.map((r) => r.image.timepoint).sort()).toEqual(
            Array.from({ length: frames }, (_, t) => t),
          );
          for (const record of records) {
            expect(record.image.name).toBe(
              `pages${pages}-t${record.image.timepoint}`,
            );
            await checkStack(record, config, record.image.timepoint);
          }
        } finally {
          await cleanUp(summary.imageIds);
        }
      });

      it("stops between files when aborted and reports what it added", async () => {
        const { backend } = ctx;
        if (!backend.ingest) return;
        const channels = await channelCount();
        const file = () => ({
          ...uploadFixture(`pages${channels}.tif`),
          dimensionConfig: {
            dimensionOrder: "xyczt" as const,
            channels,
            slices: 1,
            frames: 1,
          },
        });
        const controller = new AbortController();
        const unsubscribe = backend.subscribe((event) => {
          if (event.type === "images/didAdd") controller.abort();
        });
        const summary = await backend.ingest.upload(
          [file(), file(), file(), file()],
          { signal: controller.signal },
        );
        unsubscribe();
        try {
          expect(summary.cancelled).toBe(true);
          expect(summary.imageIds.length).toBeGreaterThanOrEqual(1);
          expect(summary.imageIds.length).toBeLessThan(4);
          const job = (await backend.jobs.list()).find(
            (j) => j.id === summary.jobId,
          );
          expect(job?.status).toBe("cancelled");
        } finally {
          await cleanUp(summary.imageIds);
        }
      });

      it("resolves at once when aborted before it starts", async () => {
        const { backend } = ctx;
        if (!backend.ingest) return;
        const controller = new AbortController();
        controller.abort();
        const summary = await backend.ingest.upload(
          [uploadFixture("pages1.tif")],
          { signal: controller.signal },
        );
        expect(summary).toEqual({ imageIds: [], failed: [], cancelled: true });
      });
    });

    describe("ingest.paths", () => {
      const ready = () =>
        ctx.serverFiles && ctx.backend.ingest?.browse
          ? { root: ctx.serverFiles.root, ingest: ctx.backend.ingest }
          : undefined;
      const channelCount = async (): Promise<number> =>
        (await ctx.backend.query.project()).experiment.channels ??
        ctx.images[0].channelIds.length;

      it("browses the root and its folders, hiding nothing it can read", async () => {
        const setup = ready();
        if (!setup) return;
        const { root, ingest } = setup;
        const top = await ingest.browse!();
        expect(top.path).toBe(root);
        expect(top.parent).toBeUndefined();
        expect(top.roots).toEqual([root]);
        const stacks = top.entries.find((e) => e.name === "stacks");
        expect(stacks?.type).toBe("directory");
        const inner = await ingest.browse!(stacks!.path);
        expect(inner.parent).toBe(root);
        expect(inner.entries.map((e) => e.name)).toEqual([
          "garbage.bin",
          "pages12.tif",
          "pages6.tif",
        ]);
        expect(inner.entries.map((e) => e.supported)).toEqual([
          false,
          true,
          true,
        ]);
        expect(inner.entries[1].size).toBeGreaterThan(0);
      });

      it("refuses paths outside the roots and folders that do not exist", async () => {
        const setup = ready();
        if (!setup) return;
        const { root, ingest } = setup;
        await expect(ingest.browse!("/")).rejects.toMatchObject({
          code: "UNAUTHORIZED",
        });
        await expect(
          ingest.browse!(`${root}/stacks/nothing-here`),
        ).rejects.toMatchObject({ code: "NOT_FOUND" });
        await expect(
          ingest.addPaths!({ paths: [`${root}/stacks/missing.tif`] }),
        ).rejects.toMatchObject({ code: "NOT_FOUND" });
      });

      it("inspects files before they are added", async () => {
        const setup = ready();
        if (!setup) return;
        const { root, ingest } = setup;
        const [stack, other] = await ingest.inspect!([
          `${root}/stacks/pages6.tif`,
          `${root}/stacks/garbage.bin`,
        ]);
        expect(stack.name).toBe("pages6.tif");
        expect(stack.frameCount).toBe(6);
        expect(stack.isMultiFrame).toBe(true);
        // A plain stack carries no layout; the dialog asks.
        expect(stack.dimensions).toBeUndefined();
        expect(stack.error).toBeUndefined();
        expect(other.frameCount).toBe(1);
        expect(other.isMultiFrame).toBe(false);
      });

      it("adds a folder's files with their configs and skips them the second time", async () => {
        const setup = ready();
        if (!setup) return;
        const { root, ingest } = setup;
        const channels = await channelCount();
        const configs = {
          [`${root}/stacks/pages6.tif`]: {
            dimensionOrder: "xyczt" as const,
            channels,
            slices: 6 / channels,
            frames: 1,
          },
          [`${root}/stacks/pages12.tif`]: {
            dimensionOrder: "xyczt" as const,
            channels,
            slices: 12 / channels,
            frames: 1,
          },
        };
        const events: Extract<BackendEvent, { type: "images/didAdd" }>[] = [];
        const unsubscribe = ctx.backend.subscribe((event) => {
          if (event.type === "images/didAdd") events.push(event);
        });
        const first = await ingest.addPaths!({
          paths: [`${root}/stacks`],
          dimensionConfigs: configs,
        });
        unsubscribe();
        try {
          expect(first.failed).toEqual([]);
          expect(first.skipped ?? []).toEqual([]);
          expect(first.cancelled).toBe(false);
          expect(first.imageIds).toHaveLength(2);
          expect(events).toHaveLength(2);
          const names = events.map((e) => e.records[0].image.name).sort();
          expect(names).toEqual(["pages12", "pages6"]);
          const planes = events
            .map((e) => e.records[0].image.shape.planes)
            .sort((a, b) => a - b);
          expect(planes).toEqual([6 / channels, 12 / channels]);
          const job = (await ctx.backend.jobs.list()).find(
            (j) => j.id === first.jobId,
          );
          expect(job?.status).toBe("succeeded");

          const again = await ingest.addPaths!({
            paths: [`${root}/stacks`],
            dimensionConfigs: configs,
          });
          expect(again.imageIds).toEqual([]);
          expect(
            (again.skipped ?? []).map((p) => p.split("/").pop()).sort(),
          ).toEqual(["pages12.tif", "pages6.tif"]);
        } finally {
          if (first.imageIds.length > 0) {
            await ctx.backend.images.delete({ ids: first.imageIds });
          }
        }
      });
    });

    describe("export", () => {
      /* A 3x2 object in the top-left of the first image, as a session
       * would commit it: rows [1 1 0] [0 1 1]. */
      const makeObject = async () => {
        const { backend } = ctx;
        const image = ctx.images[0];
        const record = (
          await backend.query.images({ ids: [image.id] }, { limit: 1 })
        ).items[0];
        const volumeId = generateUUID();
        const annotationId = generateUUID();
        const changeSet: AnnotationChangeSet = {
          imageIds: [image.id],
          volumes: {
            created: [
              {
                id: volumeId,
                imageId: image.id,
                kindId: UNKNOWN_KIND_ID,
                categoryId: UNKNOWN_KIND_CATEGORY_ID,
                timepoint: 0,
              },
            ],
            updated: [],
            deleted: [],
          },
          annotations: {
            created: [
              {
                id: annotationId,
                imageId: image.id,
                planeId: record.planes[0].id,
                volumeId,
                partition: Partition.Unassigned,
                boundingBox: [0, 0, 3, 2],
                shape: {
                  planes: 1,
                  height: 2,
                  width: 3,
                  channels: image.channelIds.length,
                },
                // Row-major runs starting with background: 0 bg, 2 fg, 2 bg, 2 fg.
                encodedMask: [0, 2, 2, 2],
              },
            ],
            updated: [],
            deleted: [],
          },
        };
        const result = await backend.annotations.commit(changeSet);
        expect(result.conflicts).toEqual([]);
        return { image, volumeId, annotationId, planeId: record.planes[0].id };
      };
      const remove = (annotationId: string) =>
        ctx.backend.annotations.delete({ ids: [annotationId] });
      const text = (file: ExportedFile) => new TextDecoder().decode(file.data);

      it("writes the Piximi JSON with the records themselves", async () => {
        const { backend } = ctx;
        if (!backend.export) return;
        const made = await makeObject();
        try {
          const file = await backend.export.annotations({
            type: AnnotationExportType.PIXIMI,
            query: { ids: [made.annotationId] },
            name: "conformance",
          });
          expect(file.fileName).toBe("conformance.json");
          expect(file.mime).toBe("application/json");
          const parsed = JSON.parse(text(file)) as {
            format: string;
            version: number;
            project: string;
            annotations: ExportedAnnotation[];
          };
          expect(parsed.format).toBe("piximi-annotations");
          expect(parsed.project).toBe("conformance");
          expect(parsed.annotations).toHaveLength(1);
          const [ann] = parsed.annotations;
          expect(ann.id).toBe(made.annotationId);
          expect(ann.imageId).toBe(made.image.id);
          expect(ann.imageName).toBe(made.image.name);
          expect(ann.planeId).toBe(made.planeId);
          expect(ann.planeIndex).toBe(0);
          expect(ann.volumeId).toBe(made.volumeId);
          expect(ann.kindId).toBe(UNKNOWN_KIND_ID);
          expect(typeof ann.kindName).toBe("string");
          expect(ann.categoryId).toBe(UNKNOWN_KIND_CATEGORY_ID);
          expect(ann.boundingBox).toEqual([0, 0, 3, 2]);
          expect(ann.encodedMask).toEqual([0, 2, 2, 2]);
          expect(ann.imageShape.width).toBe(made.image.width);
        } finally {
          await remove(made.annotationId);
        }
      });

      it("writes COCO with one image, one category and a polygon", async () => {
        const { backend } = ctx;
        if (!backend.export) return;
        const made = await makeObject();
        try {
          const file = await backend.export.annotations({
            type: AnnotationExportType.COCO,
            query: { ids: [made.annotationId] },
          });
          expect(file.fileName.endsWith(".json")).toBe(true);
          const coco = JSON.parse(text(file)) as {
            images: Array<{ id: number; file_name: string; width: number }>;
            categories: Array<{
              id: number;
              name: string;
              supercategory: string;
            }>;
            annotations: Array<{
              image_id: number;
              category_id: number;
              bbox: number[];
              area: number;
              segmentation: number[][];
              iscrowd: number;
            }>;
          };
          expect(coco.images).toHaveLength(1);
          expect(coco.images[0].file_name).toBe(made.image.name);
          expect(coco.categories).toHaveLength(1);
          expect(coco.annotations).toHaveLength(1);
          const [ann] = coco.annotations;
          expect(ann.image_id).toBe(coco.images[0].id);
          expect(ann.category_id).toBe(coco.categories[0].id);
          expect(ann.bbox).toEqual([0, 0, 3, 2]);
          expect(ann.area).toBe(4);
          expect(ann.iscrowd).toBe(0);
          expect(ann.segmentation[0].length).toBeGreaterThanOrEqual(6);
          // Every vertex lies in or on the box.
          for (let i = 0; i < ann.segmentation[0].length; i += 2) {
            expect(ann.segmentation[0][i]).toBeGreaterThanOrEqual(-0.5);
            expect(ann.segmentation[0][i]).toBeLessThanOrEqual(3.5);
            expect(ann.segmentation[0][i + 1]).toBeGreaterThanOrEqual(-0.5);
            expect(ann.segmentation[0][i + 1]).toBeLessThanOrEqual(2.5);
          }
        } finally {
          await remove(made.annotationId);
        }
      });

      it("zips label images laid out per format", async () => {
        const { backend } = ctx;
        if (!backend.export) return;
        const made = await makeObject();
        const kindName = (await backend.query.project()).kinds.find(
          (kind) => kind.id === UNKNOWN_KIND_ID,
        )!.name;
        const categoryName = (await backend.query.project()).categories.find(
          (category) => category.id === UNKNOWN_KIND_CATEGORY_ID,
        )!.name;
        const image = made.image.name;
        try {
          const expectedPaths: Record<string, string[]> = {
            [AnnotationExportType.LabeledInstances]: [
              `conformance/${image}/${kindName}.tiff`,
              `conformance/${image}/${kindName}_${categoryName}.tiff`,
            ],
            [AnnotationExportType.LabeledSemanticMasks]: [
              `conformance/${image}/${kindName}.tiff`,
            ],
            [AnnotationExportType.BinaryInstances]: [
              `conformance/${image}/${kindName}/${categoryName}_0.tiff`,
            ],
            [AnnotationExportType.BinarySemanticMasks]: [
              `conformance/${image}/${kindName}_${categoryName}.tiff`,
            ],
            [AnnotationExportType.Matrix]: [
              `conformance/${image}/${kindName}.tiff`,
            ],
          };
          for (const [type, paths] of Object.entries(expectedPaths)) {
            const file = await backend.export.annotations({
              type: type as AnnotationExportType,
              query: { ids: [made.annotationId] },
              name: "conformance",
            });
            expect(file.fileName).toBe("conformance.zip");
            expect(file.mime).toBe("application/zip");
            const zip = await JSZip.loadAsync(file.data);
            const entries = Object.keys(zip.files)
              .filter((entry) => !zip.files[entry].dir)
              .sort();
            expect(entries).toEqual([...paths].sort());
            // The matrix labels the object 1 inside its mask and 0 outside.
            if (type === AnnotationExportType.Matrix) {
              const bytes = await zip.file(paths[0])!.async("uint8array");
              // The first page is the only plane here.
              const first = decodeTiff(bytes);
              expect(first.width).toBe(made.image.width);
              expect(first.height).toBe(made.image.height);
              const pixel = (x: number, y: number) => first.getValue(x, y, 0);
              expect(pixel(0, 0)).toBe(1);
              expect(pixel(1, 0)).toBe(1);
              expect(pixel(2, 0)).toBe(0);
              expect(pixel(0, 1)).toBe(0);
              expect(pixel(2, 1)).toBe(1);
            }
          }
        } finally {
          await remove(made.annotationId);
        }
      });
    });

    describe("mutations", () => {
      it("deletes annotations by query and announces what went", async () => {
        const { backend } = ctx;
        if (!backend.segmentation) return;
        const [model] = await backend.segmentation.listModels();
        const kindName = `Gone-${Date.now()}`;
        const summary = await backend.segmentation.run({
          modelId: model.name,
          imageIds: ctx.images.map((im) => im.id),
          channelMetaIds: [],
          kindName,
        });
        expect(summary.added).toBeGreaterThan(0);
        const kind = (await backend.query.project()).kinds.find(
          (k) => k.name === kindName,
        );
        expect(kind).toBeDefined();
        const scope = { kindIds: [kind!.id] };
        const events: BackendEvent[] = [];
        const unsubscribe = backend.subscribe((e) => events.push(e));
        const { deleted } = await backend.annotations.delete(scope);
        unsubscribe();

        expect(deleted).toBe(summary.added);
        expect((await backend.query.annotationCounts(scope)).total).toBe(0);
        const removed = events.flatMap((e) =>
          e.type === "annotations/didRemove" ? e.annotationIds : [],
        );
        expect(removed.length).toBe(summary.added);
        expect(await backend.annotations.delete(scope)).toEqual({ deleted: 0 });
      });

      it("deletes an image with everything under it", async () => {
        const { backend } = ctx;
        const before = (await backend.query.imageCounts({})).total;
        const target = ctx.images[ctx.images.length - 1];
        const events: BackendEvent[] = [];
        const unsubscribe = backend.subscribe((e) => events.push(e));
        const { deleted } = await backend.images.delete({ ids: [target.id] });
        unsubscribe();

        expect(deleted).toBe(1);
        expect((await backend.query.imageCounts({})).total).toBe(before - 1);
        expect(
          (await backend.query.annotationCounts({ imageIds: [target.id] }))
            .total,
        ).toBe(0);
        expect(
          (await backend.query.images({ ids: [target.id] }, { limit: 1 }))
            .items,
        ).toEqual([]);
        const removed = events.flatMap((e) =>
          e.type === "images/didRemove" ? e.imageIds : [],
        );
        expect(removed).toContain(target.id);
        expect(await backend.images.delete({ ids: [target.id] })).toEqual({
          deleted: 0,
        });
      });
    });
  });
};
