import { v4 as uuidv4 } from "uuid";

import {
  UNKNOWN_IMAGE_CATEGORY_ID,
  UNKNOWN_KIND_CATEGORY_ID,
  UNKNOWN_KIND_ID,
} from "./unknown";

const RESERVED_IDS = new Set([
  UNKNOWN_IMAGE_CATEGORY_ID,
  UNKNOWN_KIND_ID,
  UNKNOWN_KIND_CATEGORY_ID,
]);
function* _uuidStream(definesUnknown: boolean) {
  const flag = definesUnknown ? "0" : "1";
  while (true) yield flag + uuidv4().slice(1);
}
/*
 * Generates a new UUID whilce preventing collision with predefined IDs
 * Though chances of collision are astronamically small without the guard,
 * better safe than sorry!
 */
export const generateUUID = (options?: { definesUnknown: boolean }) => {
  for (const id of _uuidStream(options?.definesUnknown ?? false)) {
    if (!RESERVED_IDS.has(id)) return id;
  }
  /*
  TypeScript doesn't know the generator is infinite, so it assumes
  for...of could end without hitting return, resulting in the return
  type of the function being `string | undefined`. The idiomatic fix 
  is an unreachable throw after the loop
  */
  throw new Error("unreachable");
};
