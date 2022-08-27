//@ts-nocheck
import hotkeys from "./hotkeys"; //{ HotkeysEvent, KeyHandler }
import React, { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { hotkeyViewSelector } from "store/application";
import {
  AvailableTags,
  HotkeysEvent,
  HotkeyView,
  KeyHandler,
  Options,
} from "types";

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

export function useHotkeys(
  keys: string,
  callback: KeyHandler,
  hotkeyView: HotkeyView | Array<HotkeyView>,
  options?: Options
): void;
export function useHotkeys(
  keys: string,
  callback: KeyHandler,
  hotkeyView: HotkeyView | Array<HotkeyView>,
  deps?: any[]
): void;
export function useHotkeys(
  keys: string,
  callback: KeyHandler,
  hotkeyView: HotkeyView | Array<HotkeyView>,
  options?: Options,
  deps?: any[]
): void;
export function useHotkeys(
  keys: string,
  callback: () => void,
  hotkeyView: HotkeyView | Array<HotkeyView>,
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
  const currentHotkeyView = useSelector(hotkeyViewSelector);
  // The return value of this callback determines if the browsers default behavior is prevented.

  const memoisedCallback = useCallback(
    (keyboardEvent: KeyboardEvent, hotkeysEvent: HotkeysEvent) => {
      if (filter && !filter(keyboardEvent)) {
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

      if (
        (hotkeyView.length && hotkeyView.includes(currentHotkeyView)) ||
        (!hotkeyView.length && hotkeyView === currentHotkeyView)
      ) {
        callback(keyboardEvent, hotkeysEvent);
        return true;
      }

      return false;
    }, //eslint-disable-next-line react-hooks/exhaustive-deps
    deps
      ? [hotkeyView, currentHotkeyView, enableOnTags, filter, ...deps]
      : [hotkeyView, currentHotkeyView, enableOnTags, filter]
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
  }, [keyup, keydown, options, memoisedCallback, keys, enabled]);
}
