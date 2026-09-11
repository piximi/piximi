// Must be imported FIRST in a worker entry point — before any other imports.
//
// `imjoy-rpc` accesses `window` at module evaluation time, and workers only
// have `self`, so alias it. Reached via the Cellpose segmenter
// (`core/dl/segmentation/models/Cellpose`), which imports `hyphaWebsocketClient`.
//
// An earlier comment here blamed zarr for this. It never did: zarr.js's only
// dependencies were `numcodecs` and `p-queue`, and the file-io workers needed
// the shim solely because they share this entry-point convention.
(self as any).window = self;
