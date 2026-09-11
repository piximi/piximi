/**
 * Path-segment escaping for zarrita's URL-based hierarchy.
 *
 * zarrita resolves child paths with
 * `decodeURIComponent(new URL(path, base).pathname)`, which cannot carry three
 * characters:
 *
 * - `%` makes `decodeURIComponent` throw `URIError: URI malformed`
 * - `#` and `?` start a URL fragment/query, so the rest of the path is dropped
 *
 * Piximi's group names are user data, so all three are reachable. Model names
 * are typed by the user, and the legacy readers key image groups by the
 * uploaded file's name — `"cells 100%.png"` is entirely ordinary in microscopy.
 * zarr.js concatenated strings and was unaffected.
 *
 * Encoding the segment does not help: `resolve` decodes, so the raw character
 * lands in `Location.path` and zarrita's own later `resolve("zarr.json")` hits
 * the same problem — for `#`/`?` it silently truncates the segment away and
 * writes metadata into the parent, collapsing two distinct names onto one key.
 *
 * So substitute characters that survive URL resolution instead, and reverse the
 * substitution in the store, which is the single place zarr paths become
 * storage keys. Nothing is renamed on disk: keys stay byte-identical to what
 * zarr.js wrote, which is what lets existing archives still open.
 *
 * Private-use code points are chosen because they cannot appear in a real name.
 */
const ESCAPES: Record<string, string> = {
  "%": "\uE000",
  "#": "\uE001",
  "?": "\uE002",
};

const UNESCAPES: Record<string, string> = {
  "\uE000": "%",
  "\uE001": "#",
  "\uE002": "?",
};

/** Apply before handing a dynamic name to `Location#resolve`. */
export const escapeSegment = (name: string): string =>
  name.replace(/[%#?]/g, (char) => ESCAPES[char]);

/** Apply when turning a zarr path into a storage key. */
export const unescapePath = (path: string): string =>
  path.replace(/[\uE000-\uE002]/g, (char) => UNESCAPES[char]);
