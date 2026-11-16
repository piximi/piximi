import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { hasCapability } from "../capabilities";

import type { BackendEvent } from "../events";
import type { Backend, ChannelDisplay, RenderRequest } from "../types";

export type ConformanceImage = {
  id: string;
  width: number;
  height: number;
  channelIds: string[];
};

export type ConformanceContext = {
  backend: Backend;
  /* Every image the backend holds, so paging can be checked for completeness. */
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

      it("pages images without gaps or duplicates", async () => {
        const seen: string[] = [];
        let cursor: string | undefined;
        do {
          const page = await ctx.backend.query.images({}, { cursor, limit: 1 });
          expect(page.total).toBe(ctx.images.length);
          expect(page.items.length).toBeLessThanOrEqual(1);
          seen.push(...page.items.map((r) => r.image.id));
          cursor = page.nextCursor;
        } while (cursor);
        expect([...seen].sort()).toEqual(ctx.images.map((im) => im.id).sort());
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
  });
};
