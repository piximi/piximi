import type {
  AnnotationCategory,
  AnnotationObject,
  AnnotationVolume,
  Category,
  ChannelMeta,
  Experiment,
  ImageObject,
  Kind,
} from "core/entities";
import type { Classifier, RunHistoryEpoch } from "core/dl/classification/types";

import type { Job } from "./jobs";
import type {
  AnnotationHeader,
  AnnotationUpdate,
  ImageRecord,
  ImageUpdate,
  ModelDescriptor,
  ProjectInfo,
  VolumeUpdate,
} from "./types";

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
  /* A kind was renamed; carries the whole list. */
  | { type: "kinds/didChange"; kinds: Kind[] }
  /* Kinds are gone with their categories and classifiers; their objects
   * moved to the reserved unknown kind (announced as `annotations/didUpdate`). */
  | { type: "kinds/didRemove"; kindIds: string[] }
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
      /* Existing metas whose value limits widened to take these images in. */
      updatedChannelMetas?: ChannelMeta[];
    }
  /*
   * The model list changed: one was registered, or its status moved (an
   * environment built, weights loaded, a failure). Carries the whole list.
   */
  | { type: "models/didChange"; models: ModelDescriptor[] }
  /* Images are gone with everything under them; ids are enough to drop. */
  | { type: "images/didRemove"; imageIds: string[] }
  | {
      type: "annotations/didRemove";
      annotationIds: string[];
      /* Volumes left without annotations, removed along with them. */
      volumeIds: string[];
    }
  /* Images were categorized, or had partitions or predictions written. */
  | { type: "images/didUpdate"; updates: ImageUpdate[] }
  /* Images were renamed, re-partitioned by hand or had their active plane
   * changed; carries each one whole. */
  | { type: "images/didChange"; images: ImageObject[] }
  | {
      type: "annotations/didUpdate";
      volumes: VolumeUpdate[];
      annotations: AnnotationUpdate[];
      /* Objects redrawn or measured by a commit, whole; masks on demand. */
      headers?: AnnotationHeader[];
    }
  /* A category was created, edited or deleted; carries the whole list. */
  | { type: "categories/didChange"; categories: Category[] }
  | { type: "project/didChange"; experiment: Experiment }
  /* The open project was replaced (opened, created or imported); every
   * client starts over from `query/project`. */
  | { type: "project/didReset"; experiment: Experiment; project: ProjectInfo }
  /* A classifier was created, updated, trained, deleted or imported, or a
   * job began or finished with it; carries every classifier. */
  | { type: "classifiers/didChange"; classifiers: Classifier[] }
  /* One epoch of a run finished; appended to that run's history. */
  | {
      type: "classifiers/didEpoch";
      classifierId: string;
      runId: string;
      epoch: RunHistoryEpoch;
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
