import { describe, expect, it } from "vitest";

import { reconcileChannelMetas } from "./utils";

import type { Channel, ChannelMeta } from "./types";

const meta = (
  id: string,
  name: string,
  over: Partial<ChannelMeta> = {},
): ChannelMeta =>
  ({
    id,
    name,
    bitDepth: 8,
    colorMap: [1, 1, 1],
    visible: true,
    minValue: 100,
    maxValue: 200,
    rampMin: 100,
    rampMax: 200,
    rampMinLimit: 100,
    rampMaxLimit: 200,
    ...over,
  }) as ChannelMeta;

const chan = (id: string, channelMetaId: string): Channel =>
  ({ id, planeId: "p", channelMetaId }) as Channel;

describe("reconcileChannelMetas", () => {
  it("adds the canonical set for a fresh, single-series project", () => {
    const metas = [meta("m0", "Channel-0"), meta("m1", "Channel-1")];
    const channels = [chan("c0", "m0"), chan("c1", "m1")];

    const r = reconcileChannelMetas([], metas, channels, 2);

    expect(r.metasToAdd.map((m) => m.id)).toEqual(["m0", "m1"]);
    expect(r.metaUpdates).toEqual([]);
    expect(r.channels.map((c) => c.channelMetaId)).toEqual(["m0", "m1"]);
  });

  it("collapses multiple fresh series to one meta per index and merges min/max", () => {
    const s0 = [
      meta("a0", "Channel-0", {
        minValue: 50,
        maxValue: 150,
        rampMinLimit: 50,
        rampMaxLimit: 150,
      }),
      meta("a1", "Channel-1", {
        minValue: 10,
        maxValue: 60,
        rampMinLimit: 10,
        rampMaxLimit: 60,
      }),
    ];
    const s1 = [
      meta("b0", "Channel-0", {
        minValue: 20,
        maxValue: 200,
        rampMinLimit: 20,
        rampMaxLimit: 200,
      }),
      meta("b1", "Channel-1", {
        minValue: 5,
        maxValue: 80,
        rampMinLimit: 5,
        rampMaxLimit: 80,
      }),
    ];
    const channels = [
      chan("c0", "a0"),
      chan("c1", "a1"),
      chan("c2", "b0"),
      chan("c3", "b1"),
    ];

    const r = reconcileChannelMetas([], [...s0, ...s1], channels, 2);

    expect(r.metasToAdd.map((m) => m.id)).toEqual(["a0", "a1"]);
    expect(r.metasToAdd[0]).toMatchObject({ minValue: 20, maxValue: 200 });
    expect(r.metasToAdd[1]).toMatchObject({ minValue: 5, maxValue: 80 });
    // every series' channels point at the canonical (first series) metas
    expect(r.channels.map((c) => c.channelMetaId)).toEqual([
      "a0",
      "a1",
      "a0",
      "a1",
    ]);
  });

  it("widens existing metas and remaps channels when the project already has metas", () => {
    const existing = [
      meta("e0", "Channel-0", {
        minValue: 100,
        maxValue: 150,
        rampMinLimit: 100,
        rampMaxLimit: 150,
      }),
      meta("e1", "Channel-1", {
        minValue: 100,
        maxValue: 150,
        rampMinLimit: 100,
        rampMaxLimit: 150,
      }),
    ];
    const incoming = [
      meta("n0", "Channel-0", {
        minValue: 20,
        maxValue: 300,
        rampMinLimit: 20,
        rampMaxLimit: 300,
      }),
      meta("n1", "Channel-1", {
        minValue: 80,
        maxValue: 120,
        rampMinLimit: 80,
        rampMaxLimit: 120,
      }),
    ];
    const channels = [chan("c0", "n0"), chan("c1", "n1")];

    const r = reconcileChannelMetas(existing, incoming, channels, 2);

    expect(r.metasToAdd).toEqual([]);
    expect(r.channels.map((c) => c.channelMetaId)).toEqual(["e0", "e1"]);
    expect(r.metaUpdates).toEqual([
      {
        id: "e0",
        changes: {
          minValue: 20,
          maxValue: 300,
          rampMinLimit: 20,
          rampMaxLimit: 300,
        },
      },
      {
        id: "e1",
        changes: {
          minValue: 80,
          maxValue: 150,
          rampMinLimit: 80,
          rampMaxLimit: 150,
        },
      },
    ]);
  });

  it("matches named channels first, then fills the rest by index", () => {
    const existing = [
      meta("e0", "Channel-0"),
      meta("dapi", "DAPI"),
      meta("e2", "Channel-2"),
    ];
    // incoming series has DAPI first; the other two use default names
    const incoming = [
      meta("i0", "DAPI"),
      meta("i1", "Channel-0"),
      meta("i2", "Channel-2"),
    ];
    const channels = [chan("c0", "i0"), chan("c1", "i1"), chan("c2", "i2")];

    const r = reconcileChannelMetas(existing, incoming, channels, 3);

    // DAPI matched by name; leftover default-named channels matched positionally
    expect(r.channels.map((c) => c.channelMetaId)).toEqual([
      "dapi",
      "e0",
      "e2",
    ]);
  });
});
