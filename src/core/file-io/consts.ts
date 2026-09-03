export const MANIFEST_VERSION = 1;
export const MODEL_JSON_FILENAME = "model.json";
export const MODEL_WEIGHTS_FILENAME = "model.weights.bin";
export const MODEL_RUNS_FILENAME = "model_runs_history.json";
export const MODEL_MANIFEST_FILENAME = "piximi_manifest.json";

/**
 * Directory inside a project archive holding one folder per saved model.
 *
 * Models must sit in their own folder rather than being renamed at the root:
 * `Model.getSavedModelFiles` bakes `./model.weights.bin` into the topology's
 * weightsManifest, and TF.js `browserFiles` matches weight files by *basename*
 * (tfjs-core `io/browser_files.js`). Renaming the file breaks that lookup;
 * nesting it keeps the basename intact while still disambiguating models.
 */
export const MODELS_DIRNAME = "models";
