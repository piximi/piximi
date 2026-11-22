import { TaskCancelledError } from "core/dl/cancel";
import { ProjectLoader } from "core/file-io/project-loader/ProjectLoader";
import { ProjectSaver } from "core/file-io/project-saver/ProjectSaver";

import { projectReset } from "store/actions";
import { classifierSlice } from "store/classifier";
import { dataSlice } from "store/data";
import { segmenterSlice } from "store/segmenter";
import { hydrateSegmenterState } from "store/segmenter/hydrate";

import { clearCache } from "utils/renderedSrcsCache";

import type { EventBus } from "../events";
import type { CallOptions, ExportedFile, ProjectInfo } from "../types";
import type { StoreHandle } from "./store";

type LocalProjectDeps = {
  store: StoreHandle;
  saver: () => ProjectSaver;
  loader: () => ProjectLoader;
  bus: EventBus;
};

/* The browser keeps one project, so this is its id for the listing. */
const LOCAL_PROJECT_ID = "local";

/*
 * The in-browser project: one at a time, in the Redux data slice and
 * IndexedDB. Export and import go through the same workers the app always
 * used (`ProjectSaver`/`ProjectLoader`), reporting through the caller's
 * options (the hooks own the task toast); a new or imported project is
 * written into the store here and announced as `project/didReset`.
 */
export class LocalProject {
  readonly #deps: LocalProjectDeps;
  readonly #createdAt = Date.now();

  constructor(deps: LocalProjectDeps) {
    this.#deps = deps;
  }

  info(): ProjectInfo {
    const { data } = this.#deps.store.getState();
    return {
      id: LOCAL_PROJECT_ID,
      name: data.experiment.name,
      createdAt: this.#createdAt,
      current: true,
      images: data.images.ids.length,
    };
  }

  async create(name: string): Promise<ProjectInfo> {
    const { store, bus } = this.#deps;
    clearCache();
    store.dispatch(projectReset());
    store.dispatch(dataSlice.actions.updateExperimentName(name));
    const info = this.info();
    bus.emit({
      type: "project/didReset",
      experiment: store.getState().data.experiment,
      project: info,
    });
    return info;
  }

  async export(name?: string, options?: CallOptions): Promise<ExportedFile> {
    const { store, saver } = this.#deps;
    const state = store.getState();
    const fileName = (name ?? state.data.experiment.name).trim() || "project";
    const projectSaver = saver();
    const onAbort = () => projectSaver.cancel();
    options?.signal?.addEventListener("abort", onAbort, { once: true });
    try {
      projectSaver.onProgress((progress) => {
        options?.onProgress?.({
          percent: progress.overallProgress * 100,
          message: "Saving project",
        });
      });
      const result = await projectSaver.saveProject({
        name: fileName,
        project: {
          data: state.data,
          classifier: state.classifier,
          segmenter: state.segmenter,
        },
      });
      if (!result.success) {
        if (result.cancelled) throw new TaskCancelledError("Save cancelled");
        throw result.error;
      }
      return {
        fileName: `${fileName}.piximi`,
        mime: "application/zip",
        data: new Uint8Array(await result.blob.arrayBuffer()),
      };
    } finally {
      options?.signal?.removeEventListener("abort", onAbort);
    }
  }

  async import(
    data: Uint8Array | Blob,
    name?: string,
    options?: CallOptions,
  ): Promise<ProjectInfo> {
    const { store, loader, bus } = this.#deps;
    const projectLoader = loader();
    const onAbort = () => projectLoader.cancel();
    options?.signal?.addEventListener("abort", onAbort, { once: true });
    try {
      projectLoader.onProgress((progress) => {
        options?.onProgress?.({
          percent: progress.overallProgress * 100,
          message: "Loading project",
        });
      });
      const file = new File(
        [data instanceof Blob ? data : data.slice()],
        `${name ?? "project"}.piximi`,
        { type: "application/zip" },
      );
      const result = await projectLoader.uploadProject([file]);
      if (!result.success) {
        if (result.cancelled) throw new TaskCancelledError("Load cancelled");
        throw result.error;
      }
      const { data: project, classifier, segmenter } = result.project;
      clearCache();
      store.dispatch(projectReset());
      store.dispatch(classifierSlice.actions.setClassifier({ classifier }));
      store.dispatch(dataSlice.actions.setState(project));
      // After projectReset, which wipes the slice back to defaults.
      store.dispatch(
        segmenterSlice.actions.setSegmenter({
          segmenter: hydrateSegmenterState(
            segmenter,
            project.channelMetas.map((meta) => meta.id),
          ),
        }),
      );
      if (name) store.dispatch(dataSlice.actions.updateExperimentName(name));
      const info = this.info();
      bus.emit({
        type: "project/didReset",
        experiment: store.getState().data.experiment,
        project: info,
      });
      return info;
    } finally {
      options?.signal?.removeEventListener("abort", onAbort);
    }
  }
}

export const defaultSaver = (): ProjectSaver => new ProjectSaver();
export const defaultLoader = (): ProjectLoader => new ProjectLoader();
