# Golden project archives

⚠️ **Do not regenerate these files.** They are the only coverage of reading an
archive produced by an *earlier* writer. Regenerating them with the current
writer makes the tests that consume them tautological — they would pass while
every archive users already have on disk fails to open.

If a test that reads one of these fails, the reader has regressed. Fix the
reader, not the fixture.

### The one edit ever made to them

A `segmenter/` group (`.zgroup` + `.zattrs`, empty `models` /
`channel_selection` / `option_values`, `loaded_model: null`) was appended to
both archives when segmenter config became part of the project format. The v2
writer had never written that group, so without it `readV2` — which reads it
unconditionally, back-filling being the converters' job — could not open these
files at all.

Appending is not regenerating: every byte the original writer produced is still
present and unchanged, so the coverage above is intact. This is the only
sanctioned way to touch these archives, and only when the reader gains a
requirement that the old writer could not have satisfied.

## Contents

| file | Piximi format | Zarr format on disk |
|---|---|---|
| `golden-v2-zarrv2.zip` | 2.0.0 | **v2** (`.zgroup` / `.zarray` / `.zattrs`, chunk keys `0.0`) |
| `golden-v2-zarrv2-edge.zip` | 2.0.0 | **v2**, adversarial values |

Both were captured from the `zarr` (zarr.js 0.6.3) writer, before the migration
to `zarrita`, by driving `writeV2` over the fixture in
`../project-saver/saveProject.test.ts` and writing
`store.zip.generateAsync({ type: "uint8array" })` to disk. Consumed by
`../project-loader/v2Archive.test.ts`.

Arrays inside are uncompressed (`"compressor": null`) and single-chunk
(`chunks === shape`) — that is zarr.js's default, not a special setting, and it
is what makes these archives readable without any codec.

### What the edge archive deliberately contains

- `precision` / `recall` / `f1_score` written from `NaN`, which zarr.js stored
  as JSON `null`. `evaluateConfusionMatrix` produces `NaN` whenever a class
  receives no predictions, so this is routine rather than exotic.
- Channel `mean` / `std` arrays with `null` entries, from the same cause.
- Falsy scalars stored as `0`: `shuffle_B`, `valid_B`, `normalize_B`,
  `center_B`, `num_crops`, `experiment_channels`, and a `visible_B` on a
  channel meta. These break any attribute reader that gates on truthiness
  instead of key presence.
- Model group names `acc 100%` and `run#2`, stored verbatim as path segments.
  `%` and `#` are the characters a URL-based path resolver cannot carry: `%`
  makes `decodeURIComponent` throw, and `#` truncates the path, collapsing two
  distinct models onto one key.

## Legacy formats (0.1 / 0.2 / 1.1)

Not stored here. `../project-loader/legacyProjects.test.ts` drives the real
example projects already committed under `src/data/exampleProjects/`, which are
genuine artifacts of those writers — no writer for them exists in the tree any
more, so they cannot be regenerated at all.
