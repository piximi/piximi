import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { CancelSource } from "core/dl/cancel";

import { IMAGE_CLASSIFIER_ID } from "store/classifier/constants";

import { loadProject } from "./loadProject";
import { isCurrentProjectArchive, upgradeProject } from "./upgradeProject";

/*
 * The bundled examples are older formats with zarr v2 metadata. A remote
 * backend reads only the current layout, so the browser rewrites them
 * first; what it writes must read back as the same project.
 */
describe("upgradeProject", () => {
  it("rewrites a legacy example as a current archive that reads the same", async () => {
    const bytes = await readFile(
      "src/data/exampleProjects/U2OSCellPaintingExampleProject.zip",
    );
    const legacy = new File(
      [new Uint8Array(bytes).slice()],
      "U2OSCellPaintingExampleProject.zip",
      {
        type: "application/zip",
      },
    );
    expect(await isCurrentProjectArchive(legacy)).toBe(false);

    const before = await loadProject(
      { files: [legacy] },
      new CancelSource().token,
      () => {},
    );
    const progress: number[] = [];
    const { data, name } = await upgradeProject(
      { files: [legacy] },
      new CancelSource().token,
      ({ value }) => progress.push(value),
    );
    expect(name).toBe(before.project.data.experiment.name);
    expect(progress.at(-1)).toBeGreaterThan(0.9);
    const upgraded = new File([data.slice()], "upgraded.piximi", {
      type: "application/zip",
    });
    expect(await isCurrentProjectArchive(upgraded)).toBe(true);

    const after = await loadProject(
      { files: [upgraded] },
      new CancelSource().token,
      () => {},
    );
    const a = before.project.data;
    const b = after.project.data;
    // The legacy readers' id lists can name entries their maps lack; the
    // entities' own ids are what the loader dispatches and the upgrade writes.
    const keys = (state: { entities: Record<string, { id: string }> }) =>
      Object.values(state.entities)
        .map((entity) => entity.id)
        .sort();
    expect(b.experiment.name).toBe(a.experiment.name);
    expect(keys(b.images)).toEqual(keys(a.images));
    expect(keys(b.annotations)).toEqual(keys(a.annotations));
    expect(keys(b.kinds)).toEqual(keys(a.kinds));
    expect(keys(b.categories)).toEqual(keys(a.categories));
    // Channel (and plane) ids are minted by the legacy converter on each
    // load, so they differ by construction; the channels are compared by
    // where they sit and what they hold.
    const channelsOf = (data: typeof a, imageName: string) => {
      const image = Object.values(data.images.entities).find(
        (im) => im.name === imageName,
      )!;
      const plane = Object.values(data.planes.entities).find(
        (pl) => pl.imageId === image.id && pl.zIndex === 0,
      )!;
      return Object.values(data.channels.entities)
        .filter((c) => c.planeId === plane.id)
        .sort((x, y) => x.name.localeCompare(y.name));
    };
    expect(Object.keys(b.channels.entities)).toHaveLength(
      Object.keys(a.channels.entities).length,
    );
    const [firstImage] = Object.values(a.images.entities);
    const before_ = channelsOf(a, firstImage.name);
    const after_ = channelsOf(b, firstImage.name);
    expect(after_.map((c) => c.name)).toEqual(before_.map((c) => c.name));
    expect(new Uint8Array(after_[0].data)).toEqual(
      new Uint8Array(before_[0].data),
    );
    // The reader fills a classifier entry for the image target and every
    // kind; whatever the legacy file had is still there.
    const targets = Object.keys(after.project.classifier.kindClassifiers);
    for (const id of Object.keys(before.project.classifier.kindClassifiers)) {
      expect(targets).toContain(id);
    }
    expect([...targets].sort()).toEqual(
      [IMAGE_CLASSIFIER_ID, ...keys(b.kinds)].sort(),
    );
  }, 120000);
});
