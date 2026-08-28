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
  enabled?: boolean; // Main setting that determines if the hotkey is enabled or not. (Default: true)
  filter?: Function; // A filter function returning whether the callback should get triggered or not. (Default: undefined)
  filterPreventDefault?: boolean; // Prevent default browser behavior if the filter function returns false. (Default: true)
  enableOnTags?: HotkeyAvailableTags[]; // Enable hotkeys on a list of tags. (Default: [])
  enableOnContentEditable?: boolean; // Enable hotkeys on tags with contentEditable props. (Default: false)
  splitKey?: string; // Character to split keys in hotkeys combinations. (Default +)
  scope?: string; // Scope. Currently not doing anything.
  keyup?: boolean; // Trigger on keyup event? (Default: undefined)
  keydown?: boolean; // Trigger on keydown event? (Default: true)
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
