import { useBackend } from "./BackendProvider";
import { hasCapability } from "./capabilities";

import type { Capability } from "./capabilities";

/* Whether the connected backend offers a feature; the UI hides the rest. */
export const useCapability = (capability: Capability): boolean =>
  hasCapability(useBackend().capabilities, capability);
