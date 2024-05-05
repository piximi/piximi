import { Tensor2D } from "@tensorflow/tfjs";
import { AlertType, ImageSortKey } from "./enums";
import { OldCategory } from "store/data/types";

/*
TENSORFLOW
*/

type ColorsMeta = {
  range: { [channel: number]: [number, number] };
  visible: { [channel: number]: boolean };
};

export type Colors = {
  color: Tensor2D; // shape: C x 3; [channel_idx, rgb]
} & ColorsMeta;

export type ColorsRaw = {
  color: [number, number, number][];
} & ColorsMeta;

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

/*
GENERATOR TYPES
*/
// https://stackoverflow.com/questions/55105558/is-there-a-way-i-can-get-the-return-type-of-the-generator-function
export type GeneratorReturnType<T extends Generator> = T extends Generator<
  any,
  infer R,
  any
>
  ? R
  : never;

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
TYPESCRIPT TYPES
*/
export type FilterType<T> = {
  [K in keyof T]?: Array<T[K]>;
};

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<T>;
export type RequireField<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type RequireOnly<T, K extends keyof T> = Partial<Omit<T, K>> &
  Required<Pick<T, K>>;

export type RecursivePartial<T> = {
  [K in keyof T]?: RecursivePartial<T[K]>;
};

/*
SORTING
*/

export type ImageSortKeyType = {
  imageSortKeyName: string;
  imageSortKey: ImageSortKey;
  comparerFunction: (
    a: { name: string; category: OldCategory },
    b: { name: string; category: OldCategory }
  ) => number;
  objectType: string;
};
