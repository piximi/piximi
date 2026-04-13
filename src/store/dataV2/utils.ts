import { mutatingFilter } from "utils/arrayUtils";
import {
  AnnotationObject,
  AnnotationVolume,
  Category,
  Channel,
  ChannelMeta,
  DataRelationships,
  ImageObject,
  Plane,
} from "./types";

export function pushRelationship<T extends Record<string, string[]>>(
  map: Record<string, T>,
  key: string,
  init: () => T,
  fn: (entry: T) => void,
) {
  if (!map[key]) map[key] = init();
  fn(map[key]);
}
export function removeRelationship<T extends Record<string, string[]>>(
  map: Record<string, T>,
  parentKey: string,
  childArrayKey: keyof T,
  id: string,
) {
  const entry = map[parentKey];
  if (!entry) return;
  mutatingFilter(
    entry[childArrayKey] as string[],
    (existingId) => existingId !== id,
  );
}
export function moveRelationship<T extends Record<string, string[]>>(
  map: Record<string, T>,
  arrayKey: keyof T,
  id: string,
  oldParentKey: string,
  newParentKey: string,
) {
  if (!map[oldParentKey]) {
    if (import.meta.env.DEV) {
      console.warn(
        `moveRelationship: old parent "${oldParentKey}" does not exist`,
      );
    }
    return;
  }
  mutatingFilter(map[oldParentKey][arrayKey] as string[], (i) => i !== id);
  if (!map[newParentKey]) {
    if (import.meta.env.DEV) {
      console.warn(
        `moveRelationship: new parent "${newParentKey}" does not exist`,
      );
    }
    return;
  }
  (map[newParentKey][arrayKey] as string[]).push(id);
}

export function updateCategoryRelationships(
  relationshipLookup: DataRelationships,
  categories: Array<Category>,
) {
  categories.forEach((cat) => {
    // ImageCategory has no kinds relationship — only AnnotationCategory does
    if (cat.type === "annotation")
      pushRelationship(
        relationshipLookup.kinds,
        cat.kindId,
        () => ({ categoryIds: [], annotationVolumeIds: [] }),
        (e) => e.categoryIds.push(cat.id),
      );
  });
}
export function updateChannelMetaRelationships(
  relationshipLookup: DataRelationships,
  channelMetas: Array<ChannelMeta>,
) {
  channelMetas.forEach((chMeta) => {
    pushRelationship(
      relationshipLookup.imageSeries,
      chMeta.seriesId,
      () => ({ imageIds: [], channelMetaIds: [] }),
      (e) => e.channelMetaIds.push(chMeta.id),
    );
  });
}
export function updateImageRelationships(
  relationshipLookup: DataRelationships,
  images: Array<ImageObject>,
) {
  images.forEach((im) => {
    pushRelationship(
      relationshipLookup.imageSeries,
      im.seriesId,
      () => ({ imageIds: [], channelMetaIds: [] }),
      (e) => e.imageIds.push(im.id),
    );
    pushRelationship(
      relationshipLookup.imageCategories,
      im.categoryId,
      () => ({ imageIds: [] }),
      (e) => e.imageIds.push(im.id),
    );
  });
}
export function updateAnnotationVolumeRelationships(
  relationshipLookup: DataRelationships,
  annotationVolumes: Array<AnnotationVolume>,
) {
  annotationVolumes.forEach((annVol) => {
    pushRelationship(
      relationshipLookup.images,
      annVol.imageId,
      () => ({ planeIds: [], annotationVolumeIds: [] }),
      (e) => e.annotationVolumeIds.push(annVol.id),
    );
    pushRelationship(
      relationshipLookup.kinds,
      annVol.kindId,
      () => ({ categoryIds: [], annotationVolumeIds: [] }),
      (e) => e.annotationVolumeIds.push(annVol.id),
    );
    pushRelationship(
      relationshipLookup.annotationCategories,
      annVol.categoryId,
      () => ({ annotationVolumeIds: [] }),
      (e) => e.annotationVolumeIds.push(annVol.id),
    );
  });
}
export function updatePlaneRelationships(
  relationshipLookup: DataRelationships,
  planes: Array<Plane>,
) {
  planes.forEach((pl) => {
    pushRelationship(
      relationshipLookup.images,
      pl.imageId,
      () => ({ planeIds: [], annotationVolumeIds: [] }),
      (e) => e.planeIds.push(pl.id),
    );
  });
}
export function updateChannelRelationships(
  relationshipLookup: DataRelationships,
  channels: Array<Channel>,
) {
  channels.forEach((ch) => {
    pushRelationship(
      relationshipLookup.planes,
      ch.planeId,
      () => ({ channelIds: [], annotationIds: [] }),
      (e) => e.channelIds.push(ch.id),
    );
    pushRelationship(
      relationshipLookup.channelMetas,
      ch.channelMetaId,
      () => ({ channelIds: [] }),
      (e) => e.channelIds.push(ch.id),
    );
  });
}
export function updateAnnotationRelationships(
  relationshipLookup: DataRelationships,
  annotations: Array<AnnotationObject>,
) {
  annotations.forEach((ann) => {
    pushRelationship(
      relationshipLookup.planes,
      ann.planeId,
      () => ({ channelIds: [], annotationIds: [] }),
      (e) => e.annotationIds.push(ann.id),
    );
    pushRelationship(
      relationshipLookup.annotationVolumes,
      ann.volumeId,
      () => ({ annotationIds: [] }),
      (e) => e.annotationIds.push(ann.id),
    );
  });
}
export function removeAnnotationVolumeRelationships(
  relationshipLookup: DataRelationships,
  annotationVolumes: Array<AnnotationVolume>,
) {
  annotationVolumes.forEach((annVol) => {
    removeRelationship(
      relationshipLookup.images,
      annVol.imageId,
      "annotationVolumeIds",
      annVol.id,
    );
    removeRelationship(
      relationshipLookup.kinds,
      annVol.kindId,
      "annotationVolumeIds",
      annVol.id,
    );
    removeRelationship(
      relationshipLookup.annotationCategories,
      annVol.categoryId,
      "annotationVolumeIds",
      annVol.id,
    );
  });
}
export function removeAnnotationRelationships(
  relationshipLookup: DataRelationships,
  annotations: Array<AnnotationObject>,
) {
  annotations.forEach((ann) => {
    removeRelationship(
      relationshipLookup.planes,
      ann.planeId,
      "annotationIds",
      ann.id,
    );
    removeRelationship(
      relationshipLookup.annotationVolumes,
      ann.volumeId,
      "annotationIds",
      ann.id,
    );
  });
}

export function removeImageRelationships(
  relationshipLookup: DataRelationships,
  images: Array<ImageObject>,
) {
  images.forEach((im) => {
    removeRelationship(
      relationshipLookup.imageSeries,
      im.seriesId,
      "imageIds",
      im.id,
    );
    removeRelationship(
      relationshipLookup.imageCategories,
      im.categoryId,
      "imageIds",
      im.id,
    );
  });
}
