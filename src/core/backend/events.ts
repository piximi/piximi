import type {
  AnnotationCategory,
  AnnotationObject,
  AnnotationVolume,
  ChannelMeta,
  Kind,
} from "core/entities";

import type { Job } from "./jobs";
import type { ImageRecord, SegmentationModelDescriptor } from "./types";

/*
 * Changes a backend announces after the fact. Both backends emit these for
 * their own operations (a segmentation run adds annotations); a remote backend
 * also emits them for changes made elsewhere, e.g. from a notebook. The sync
 * layer turns them into store updates.
 */
export type BackendEvent =
  | {
      type: "kinds/didAdd";
      kinds: Array<{ kind: Kind; category: AnnotationCategory }>;
    }
  | {
      type: "annotations/didAdd";
      volumes: AnnotationVolume[];
      annotations: AnnotationObject[];
    }
  | { type: "jobs/didUpdate"; job: Job }
  | {
      type: "images/didAdd";
      records: ImageRecord[];
      /* Only metas created for these images; existing ones are not repeated. */
      channelMetas: ChannelMeta[];
    }
  /*
   * The model list changed: one was registered, or its status moved (an
   * environment built, weights loaded, a failure). Carries the whole list.
   */
  | { type: "models/didChange"; models: SegmentationModelDescriptor[] }
  /* Images are gone with everything under them; ids are enough to drop. */
  | { type: "images/didRemove"; imageIds: string[] }
  | {
      type: "annotations/didRemove";
      annotationIds: string[];
      /* Volumes left without annotations, removed along with them. */
      volumeIds: string[];
    };

export type BackendEventListener = (event: BackendEvent) => void;

export class EventBus {
  #listeners = new Set<BackendEventListener>();

  subscribe(listener: BackendEventListener): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  emit(event: BackendEvent): void {
    for (const listener of this.#listeners) listener(event);
  }
}
