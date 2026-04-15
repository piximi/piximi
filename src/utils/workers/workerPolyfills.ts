// Must be imported FIRST in worker.ts — before any other imports.
// zarr → imjoy-rpc accesses `window` at module evaluation time.
// Workers only have `self`, so alias it.
(self as any).window = self;
