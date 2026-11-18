import { extendPlaneChannels } from "store/data/selectors";

import type { AnnotationRecord, ImageRecord } from "core/backend";
import type {
  CategoryEntities,
  Channel,
  ChannelMetaEntities,
  ExtendedAnnotationObject,
  ExtendedImageObject,
  ImageEntities,
  PlaneEntities,
} from "core/entities";

/*
 * Grid rows come from the backend as records; what a cell shows also needs
 * the category, the channel display settings and (for an object) its image
 * and plane, which the store mirrors. These join the two.
 */

export type ImageLookups = {
  categories: CategoryEntities;
  channelMetas: ChannelMetaEntities;
};

export const extendImage = (
  record: ImageRecord,
  { categories, channelMetas }: ImageLookups,
): ExtendedImageObject | null => {
  const { image } = record;
  const category = categories[image.categoryId];
  const plane = record.planes.find((p) => p.id === image.activePlaneId);
  if (!category || !plane) return null;
  const channelsRef = extendPlaneChannels(
    record.channels.filter((c) => c.planeId === plane.id),
    channelMetas,
  );
  if (channelsRef.length === 0) return null;
  return { ...image, category, activePlaneIdx: plane.zIndex, channelsRef };
};

export type AnnotationLookups = ImageLookups & {
  images: ImageEntities;
  planes: PlaneEntities;
  channelsByPlane: Map<string, Channel[]>;
};

export const extendAnnotation = (
  record: AnnotationRecord,
  lookups: AnnotationLookups,
): ExtendedAnnotationObject | null => {
  const { annotation, volume } = record;
  const category = lookups.categories[volume.categoryId];
  const image = lookups.images[annotation.imageId];
  const plane = lookups.planes[annotation.planeId];
  if (!category || !image || !plane) return null;
  const channelsRef = extendPlaneChannels(
    lookups.channelsByPlane.get(plane.id) ?? [],
    lookups.channelMetas,
  );
  if (channelsRef.length === 0) return null;
  const { id: _volumeId, imageId: _imageId, ...volumeProps } = volume;
  return {
    ...annotation,
    // Masks stay on the backend; nothing in the grid reads them.
    encodedMask: [],
    category,
    channelsRef,
    planeIdx: plane.zIndex,
    imageName: image.name,
    ...volumeProps,
  };
};
