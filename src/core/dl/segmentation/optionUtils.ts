import type {
  SegmenterOptionField,
  SegmenterOptionSchema,
  SegmenterOptionValues,
} from "./types";

/*
 * Well-known option key. A model whose channel policy is `passthrough` may
 * declare this field to offer a library-specific explicit selection (e.g.
 * cellpose's chan/chan2) as an alternative to passing channels through. The
 * channel UI hides its own picker while this is set to `CHANNEL_MODE_LEGACY`,
 * because the model's own selection supersedes it.
 */
export const CHANNEL_MODE_KEY = "channelMode";
export const CHANNEL_MODE_PASSTHROUGH = "passthrough";
export const CHANNEL_MODE_LEGACY = "legacy";

const schemaFields = (schema?: SegmenterOptionSchema): SegmenterOptionField[] =>
  schema?.groups.flatMap((g) => g.fields) ?? [];

/*
 * Seed values from the schema. A `number` field without a `default` (an
 * optional one such as Cellpose's diameter) seeds to `undefined`, which the
 * mapper reads as "omit the key and let the library decide".
 */
export const defaultOptionValues = (
  schema?: SegmenterOptionSchema,
): SegmenterOptionValues =>
  schemaFields(schema).reduce((values: SegmenterOptionValues, field) => {
    values[field.key] = field.default;
    return values;
  }, {});

/* A field guarded by `visibleWhen` shows only while that condition holds. */
export const isFieldVisible = (
  field: SegmenterOptionField,
  values: SegmenterOptionValues,
) =>
  field.visibleWhen === undefined ||
  values[field.visibleWhen.key] === field.visibleWhen.equals;

/*
 * Reduce the UI's working values to something safe to structured-clone across
 * the Comlink boundary: only keys the model declared, only primitives. Guards
 * against a stray event object or callback reaching `postMessage` (which throws
 * DataCloneError) and against stale keys from a previously loaded model.
 */
export const sanitizeOptions = (
  schema: SegmenterOptionSchema | undefined,
  values: SegmenterOptionValues,
): SegmenterOptionValues =>
  schemaFields(schema).reduce((clean: SegmenterOptionValues, field) => {
    const value = values[field.key];
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "string"
    ) {
      clean[field.key] = value;
    }
    return clean;
  }, {});
