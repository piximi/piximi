import JSZip from "jszip";

import { STORES } from "core/entities";
import { PiximiStore } from "core/file-io/zarr/stores";
import { writeV2 } from "core/file-io/project-saver/version-writers/writeV2";

import { hydrateSegmenterState } from "store/segmenter/hydrate";

import { loadProject } from "./loadProject";

import type { Token } from "core/dl/cancel";
import type { ChannelDataAccessor } from "core/file-io/project-saver/types";

import type { LoadProjectInput } from "./types";

const fromEntities = <T>(state: {
  ids: string[];
  entities: Record<string, T>;
}): { ids: string[]; entities: Record<string, T> } => ({
  ids: Object.keys(state.entities),
  entities: state.entities,
});

/*
 * Whether an archive is already in the current layout (a zarr v3 tree, one
 * `zarr.json` per node). Older files, including every bundled example,
 * carry zarr v2 metadata and one of the earlier formats, which only the
 * browser's readers and converters understand.
 */
export const isCurrentProjectArchive = async (file: Blob): Promise<boolean> => {
  const zip = await JSZip.loadAsync(file);
  return zip.file(/(^|\/)[^/]+\.zarr\/zarr\.json$/).length > 0;
};

/*
 * Rewrites any project file the browser can read as a current one: read it
 * (which upgrades it through the version converters), then write it back
 * with the v2 writer. The channel buffers stay in memory between the two,
 * so nothing touches IndexedDB; a backend that reads only the current
 * format (the engine) can then take the result.
 */
export async function upgradeProject(
  input: LoadProjectInput,
  cancelToken: Token,
  onProgress: ({ value }: { value: number }) => void,
): Promise<{ data: Uint8Array; name: string }> {
  const { project } = await loadProject(input, cancelToken, ({ value }) =>
    onProgress({ value: value * 0.6 }),
  );
  const { classifier, segmenter } = project;
  // The converters can leave an id list naming entries its map lacks; the
  // loader reads the maps, so it never noticed, but the writer walks the
  // ids. Rebuild every list from its map.
  const data = {
    ...project.data,
    imageSeries: fromEntities(project.data.imageSeries),
    images: fromEntities(project.data.images),
    planes: fromEntities(project.data.planes),
    kinds: fromEntities(project.data.kinds),
    categories: fromEntities(project.data.categories),
    channels: fromEntities(project.data.channels),
    channelMetas: fromEntities(project.data.channelMetas),
    annotationVolumes: fromEntities(project.data.annotationVolumes),
    annotations: fromEntities(project.data.annotations),
  };
  const accessor: ChannelDataAccessor = async (channelIds) =>
    new Map(
      channelIds.map((id) => {
        const channel = data.channels.entities[id]!;
        return [id, { data: channel.data, histogram: channel.histogram }];
      }),
    );
  const name = data.experiment.name.replace(/[./\\]/g, "_") || "project";
  const store = new PiximiStore(name);
  // The writer's channel type carries a storage reference (where the
  // browser's store put the pixels); here they never left memory, so each
  // channel points at itself.
  const channels = {
    ids: data.channels.ids,
    entities: Object.fromEntries(
      data.channels.ids.map((id) => {
        const channel = data.channels.entities[id]!;
        return [
          id,
          {
            ...channel,
            storageReference: {
              storageId: id,
              storeName: STORES.CHANNEL_DATA,
              width: channel.width,
              height: channel.height,
              dtype: channel.dtype,
              byteSize: channel.data.byteLength,
            },
          },
        ];
      }),
    ),
  };
  await writeV2(
    store,
    {
      data: { ...data, channels },
      classifier,
      segmenter: hydrateSegmenterState(
        segmenter,
        data.channelMetas.ids.map((id) => id as string),
      ),
    },
    accessor,
    (value) => onProgress({ value: 0.6 + value * 0.3 }),
  );
  const bytes = await store.zip.generateAsync(
    {
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 1 },
    },
    ({ percent }) => onProgress({ value: 0.9 + percent / 1000 }),
  );
  return { data: bytes, name: data.experiment.name };
}
