import { failure } from "io-ts/lib/PathReporter";
import { KeyofC as IOTSKeyofC, keyof as IOTSKeyof } from "io-ts";
import { logger } from "utils/common/logUtils";

export const toError = (errors: any) => {
  import.meta.env.NODE_ENV !== "production" && logger(errors);
  throw new Error(failure(errors).join("\n"));
};

export function enumToCodec<E extends Record<string, string>>(
  e: E,
): IOTSKeyofC<Record<E[keyof E], null>> {
  const values = Object.values(e);
  return IOTSKeyof(
    values.reduce<Record<string, null>>((acc, value) => {
      acc[value] = null;
      return acc;
    }, {}),
  );
}
