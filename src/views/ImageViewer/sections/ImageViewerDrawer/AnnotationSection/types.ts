// Data model + pure filtering logic for the annotations drawer.
// No React here — easy to unit-test and reuse.

import type { ExtendedKind } from "store/dataV2/types";

import type { CategoryNode } from "@ImageViewer/state/types";

// ---- view-model types (shared between the tree and its container) ----

/** A kind enriched with per-view counts and aggregate selection flags. */
export interface KindNode extends Omit<ExtendedKind, "cats"> {
  cats: CategoryNode[];
  count: number;
  allSel: boolean;
  someSel: boolean;
}

/** Which kind of taxonomy entity a CRUD action targets. */
export type EntityType = "kind" | "cat";

/** Scope selector for delete/export actions. */
export type ScopeId = "selected" | "view" | "plane" | "image";

/** A delete/export scope option, with its current annotation count. */
export type OpScope = { id: ScopeId; label: string; count: number };

type WithSiblings = { name: string; existingNames: Array<string> };

export type TaxonomyDialogRequest =
  | ({ mode: "create"; type: "kind" } & WithSiblings)
  | ({ mode: "edit"; type: "kind"; kindId: string } & WithSiblings)
  | ({ mode: "create"; type: "cat"; kindId: string } & WithSiblings)
  | ({
      mode: "edit";
      type: "cat";
      kindId: string;
      catId: string;
      color: string;
    } & WithSiblings);
