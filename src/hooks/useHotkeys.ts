import { useEffect, useEffectEvent } from "react";

import { useSelector } from "react-redux";

import { selectHotkeyContext } from "store/applicationSettings/selectors";

import hotkeys from "utils/hotkeys/hotkeys"; //{ HotkeysEvent, KeyHandler }

import type { HotkeyContext } from "utils/enums";
import type {
  HotkeyAvailableTags,
  HotkeyOptions,
  HotkeysEvent,
  HotkeyKeyHandler,
} from "utils/types";

// We implement our own custom filter system.

const tagFilter = (
  { target }: KeyboardEvent,
  enableOnTags?: HotkeyAvailableTags[],
) => {
  const targetTagName = target && (target as HTMLElement).tagName;

  return Boolean(
    targetTagName &&
      enableOnTags &&
      enableOnTags.includes(targetTagName as HotkeyAvailableTags),
  );
};

const isKeyboardEventTriggeredByInput = (ev: KeyboardEvent) => {
  return tagFilter(ev, ["INPUT", "TEXTAREA", "SELECT"]);
};

export function useHotkeys(
  keys: string,
  callback: HotkeyKeyHandler,
  hotkeyContext: HotkeyContext | Array<HotkeyContext>,
  options: HotkeyOptions = {},
): void {
  const {
    enableOnTags,
    filter,
    filterPreventDefault = true,
    enabled = true,
    enableOnContentEditable = false,
    keyup,
    keydown,
    splitKey,
  } = options;
  const currentHotkeyContext = useSelector(selectHotkeyContext);
  // The return value of this callback determines if the browsers default behavior is prevented.

  const onKey = useEffectEvent(
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
        (Array.isArray(hotkeyContext) &&
          hotkeyContext.includes(currentHotkeyContext)) ||
        (!Array.isArray(hotkeyContext) &&
          hotkeyContext === currentHotkeyContext)
      ) {
        callback(keyboardEvent, hotkeysEvent);
        return true;
      }

      return false;
    },
  );

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent, he: HotkeysEvent) => onKey(e, he);
    // hotkeys defaults keydown to true, so a keyup-only binding must opt out explicitly.
    hotkeys(
      keys,
      { keyup, keydown: keyup && keydown !== true ? false : keydown, splitKey },
      handler,
    );

    return () => hotkeys.unbind(keys, handler);
  }, [keys, enabled, keyup, keydown, splitKey]);
}
