/*
 * What a backend can do, declared at connect time. The UI hides features whose
 * capability is absent, and a backend must not expose a domain it does not
 * declare (the conformance suite checks this).
 */
export const CAPABILITIES = [
  // `render.raw` is available: the viewer may keep compositing on the GPU
  // instead of asking the backend for composites.
  "raw-local",
  "segmentation",
  "classification",
  "classification.train",
  // `classification.importFromUrl` is available: a tfjs model fetched by
  // URL lives in the browser's own worker, so only the in-browser backend
  // declares this.
  "classification.import-url",
  "measurements",
  "ingest.upload",
  "ingest.paths",
  "export.annotations",
  "project.io",
  // The backend keeps several projects and can switch between them.
  "project.workspace",
  "annotations.commit",
  // The backend can originate changes (notebook, other clients) and pushes
  // them as events, rather than only echoing this client's own operations.
  "events.push",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const hasCapability = (
  capabilities: readonly Capability[],
  capability: Capability,
): boolean => capabilities.includes(capability);
