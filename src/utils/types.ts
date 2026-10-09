import type { AlertType } from "./enums";

/*
TYPESCRIPT TYPES
*/

export type FilterType<T> = {
  [K in keyof T]?: T[K] extends string
    ? Array<T[K]>
    : { min: number; max: number };
};

// --> RequiredField
export type RequireField<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

// --> PartialExcept
export type RequireOnly<T, K extends keyof T> = Partial<Omit<T, K>> &
  Required<Pick<T, K>>;

export type RecursivePartial<T> = {
  [K in keyof T]?: RecursivePartial<T[K]>;
};

export type KeysWithValuesOfType<T, V> = {
  [K in keyof T]-?: T[K] extends V | undefined ? K : never;
}[keyof T];

export type AtLeastOne<T, K extends keyof T = keyof T> = K extends keyof T
  ? Required<Pick<T, K>> & Partial<Omit<T, K>>
  : never;

/*
ALERT TYPES
*/

export type AlertState = {
  alertType: AlertType;
  name: string;
  description: string;
  component?: string;
  stackTrace?: string;
  visible?: boolean;
};

export type LoadCB = (loadPercent: number, loadMessage: string) => void;
export type TaskError = {
  source: string;
  error: Error;
  recoverable: boolean;
};

export const INITIAL_PROGRESS: Progress = {
  stage: "idle",
  stageProgress: 0,
  overallProgress: 0,
  processedCount: 0,
  totalCount: 0,
  errors: new Map<string, TaskError[]>(),
  warnings: [],
};
export type Progress = {
  stage: string;
  stageProgress: number; // 0-100 for current stage
  overallProgress: number; // 0-100 for entire pipeline
  currentTask?: string;
  processedCount: number;
  totalCount: number;
  errors: Map<string, TaskError[]>;
  warnings: string[];
};

/*
  HOTKEY TYPES
  */

export type HotkeyAvailableTags = "INPUT" | "TEXTAREA" | "SELECT";

export interface HotkeysEvent {
  key: string;
  method: HotkeyKeyHandler;
  mods: number[];
  scope: string;
  shortcut: string;
}

export interface HotkeyKeyHandler {
  (keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent): void | boolean;
}

export type HotkeyHandlerItem = {
  keyup: boolean;
  keydown: boolean;
  mods: number[];
  shortcut: string;
  method: Function;
  key: string;
  splitKey: string;
  element: Document;
};

export type HotkeyOptions = {
  enabled?: boolean; // Bind the hotkey at all. (Default: true)
  filter?: (event: KeyboardEvent) => boolean; // Return false to skip the callback. (Default: undefined)
  filterPreventDefault?: boolean; // Prevent default browser behavior if the filter returns false. (Default: true)
  enableOnTags?: HotkeyAvailableTags[]; // Enable hotkeys on these tags. (Default: [])
  enableOnContentEditable?: boolean; // Enable hotkeys on contentEditable elements. (Default: false)
  splitKey?: string; // Character to split keys in combinations. (Default: +)
  keyup?: boolean; // Trigger on keyup. (Default: false)
  keydown?: boolean; // Trigger on keydown. (Default: true, or false when keyup is set)
};

/*
GENERAL
*/

export type Point = {
  x: number;
  y: number;
};
export type Edge = {
  p1: Point;
  p2: Point;
};

export type Points = Array<Point>;
export type HTMLDataAttributes = Record<`data-${string}`, string>;
