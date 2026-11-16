import type {
  AnnotationCategory,
  AnnotationObject,
  AnnotationVolume,
  Kind,
} from "core/entities";

import type { Job } from "./jobs";

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
  | { type: "jobs/didUpdate"; job: Job };

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
