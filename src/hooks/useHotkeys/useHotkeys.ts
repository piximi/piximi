//@ts-nocheck
import hotkeys from "./hotkeys"; //{ HotkeysEvent, KeyHandler }
import React, { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { hotkeyViewSelector } from "store/application";
import { HotkeyView } from "types";

type AvailableTags = "INPUT" | "TEXTAREA" | "SELECT";

// We implement our own custom filter system.

const tagFilter = (
  { target }: KeyboardEvent,
  enableOnTags?: AvailableTags[]
) => {
  const targetTagName = target && (target as HTMLElement).tagName;

  return Boolean(
    targetTagName &&
      enableOnTags &&
      enableOnTags.includes(targetTagName as AvailableTags)
  );
};

const isKeyboardEventTriggeredByInput = (ev: KeyboardEvent) => {
  return tagFilter(ev, ["INPUT", "TEXTAREA", "SELECT"]);
};

export interface HotkeysEvent {
  key: string;
  method: KeyHandler;
  mods: number[];
  scope: string;
  shortcut: string;
}

export interface KeyHandler {
  (keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent): void | boolean;
}

export type Options = {
  enabled?: boolean; // Main setting that determines if the hotkey is enabled or not. (Default: true)
  filter?: typeof hotkeys.filter; // A filter function returning whether the callback should get triggered or not. (Default: undefined)
  filterPreventDefault?: boolean; // Prevent default browser behavior if the filter function returns false. (Default: true)
  enableOnTags?: AvailableTags[]; // Enable hotkeys on a list of tags. (Default: [])
  enableOnContentEditable?: boolean; // Enable hotkeys on tags with contentEditable props. (Default: false)
  splitKey?: string; // Character to split keys in hotkeys combinations. (Default +)
  scope?: string; // Scope. Currently not doing anything.
  keyup?: boolean; // Trigger on keyup event? (Default: undefined)
  keydown?: boolean; // Trigger on keydown event? (Default: true)
};

export function useHotkeys<T extends Element>(
  keys: string,
  callback: KeyHandler,
  hotkeyView: HotkeyView,
  options?: Options
): void;
export function useHotkeys<T extends Element>(
  keys: string,
  callback: KeyHandler,
  hotkeyView: HotkeyView,
  deps?: any[]
): void;
export function useHotkeys<T extends Element>(
  keys: string,
  callback: KeyHandler,
  hotkeyView: HotkeyView,
  options?: Options,
  deps?: any[]
): void;
export function useHotkeys<T extends Element>(
  keys: string,
  callback: KeyHandler,
  hotkeyView: HotkeyView,
  options?: any[] | Options,
  deps?: any[]
): void {
  if (options instanceof Array) {
    deps = options;
    options = undefined;
  }

  const {
    enableOnTags,
    filter,
    keyup,
    keydown,
    filterPreventDefault = true,
    enabled = true,
    enableOnContentEditable = false,
  } = (options as Options) || {};
  console.log("registering useHotKeys HOOK");
  const currentHotkeyView = useSelector(hotkeyViewSelector);
  console.log(keys);
  // The return value of this callback determines if the browsers default behavior is prevented.
  const memoisedCallback = useCallback(
    (keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => {
      if (filter && !filter(keyboardEvent)) {
        console.log("filtered");
        return !filterPreventDefault;
      }

      // Check whether the hotkeys was triggered inside an input and that input is enabled or if it was triggered by a content editable tag and it is enabled.
      if (
        (isKeyboardEventTriggeredByInput(keyboardEvent) &&
          !tagFilter(keyboardEvent, enableOnTags)) ||
        ((keyboardEvent.target as HTMLElement)?.isContentEditable &&
          !enableOnContentEditable)
      ) {
        return true;
      }

      if (true) {
        //hotkeyView === currentHotkeyView
        callback(keyboardEvent, hotkeysEvent);
        return true;
      }

      return false;
    },
    deps
      ? [/*hotkeyView, currentHotkeyView,*/ enableOnTags, filter, ...deps]
      : [/*hotkeyView, currentHotkeyView,*/ enableOnTags, filter]
  );

  useEffect(() => {
    if (!enabled) {
      hotkeys.unbind(keys, memoisedCallback);

      return;
    }

    // In this case keydown is likely undefined, so we set it to false,
    // since hotkeys sets `keydown` to true in absense of explicit setting.
    if (keyup && keydown !== true) {
      (options as Options).keydown = false;
    }

    hotkeys(keys, (options as Options) || {}, memoisedCallback);

    return () => hotkeys.unbind(keys, memoisedCallback);
  }, [memoisedCallback, keys, enabled]);
}
