import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Partition } from "core/entities";

import { hasCapability } from "../capabilities";
import { randomKey } from "../query";

import type { BackendEvent } from "../events";
import type { Backend, ChannelDisplay, RenderRequest } from "../types";

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
        expect(typeof backend.render.raw === "function").toBe(
          hasCapability(backend.capabilities, "raw-local"),
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

    // Last, since it removes from the project the earlier blocks count.
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
