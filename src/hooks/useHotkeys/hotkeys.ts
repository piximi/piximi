import { HandlerItem } from "types";
import { getMods, getKeys, compareArray } from "./hotkeyUtils";
import { _keyMap, _modifier, modifierMap, _mods, _handlers } from "./hotkeyVar";

let _downKeys: number[] = []; // record the binding key pressed
let winListendFocus = false; // Whether the window has listened to the focus event
let _scope = "all"; // Default hotkey range
const elementHasBindEvent: Document[] = []; // Node records for bound events

// return key code
const code = (x: string) =>
  _keyMap[x.toLowerCase()] ||
  _modifier[x.toLowerCase()] ||
  x.toUpperCase().charCodeAt(0);

//Set to get the current scope (defaults to 'all')
function setScope(scope: string) {
  _scope = scope || "all";
}
// get current scope
function getScope() {
  return _scope || "all";
}
// Get the key value of the bound key pressed
function getPressedKeyCodes() {
  return _downKeys.slice(0);
}

function filter(event: string) {
  return true;
}

// Determine whether the pressed key is a certain key, return true or false
function isPressed(keyCode: string | number) {
  if (typeof keyCode === "string") {
    keyCode = code(keyCode); // Convert to keycode
  }
  return _downKeys.indexOf(keyCode) !== -1;
}

// Loop through all scopes in handlers
function deleteScope(scope: string, newScope: string) {
  let handlers;
  let i;

  // No scope is specified, get scope
  if (!scope) scope = getScope();

  for (const key in _handlers) {
    if (Object.prototype.hasOwnProperty.call(_handlers, key)) {
      handlers = _handlers[key];
      for (i = 0; i < handlers.length; ) {
        if (handlers[i].scope === scope) handlers.splice(i, 1);
        else i++;
      }
    }
  }

  // If the scope is removed, reset the scope to all
  if (getScope() === scope) setScope(newScope || "all");
}

// Clear modifier keys
function clearModifier(event: KeyboardEvent) {
  let key = event.keyCode || event.which || event.charCode;
  const i = _downKeys.indexOf(key);

  // Clear pressed key from list
  if (i >= 0) {
    _downKeys.splice(i, 1);
  }
  // Special treatment cmmand key, the problem that the combination
  // of shortcut keys keyup in cmmand is only executed once
  if (event.key && event.key.toLowerCase() === "meta") {
    _downKeys.splice(0, _downKeys.length);
  }

  // Modifier key shiftKey altKey ctrlKey (command||metaKey) clear
  if (key === 93 || key === 224) key = 91;
  if (key in _mods) {
    _mods[key] = false;

    // reset modifier keys to false
    for (const k in _modifier) if (_modifier[k] === key) setModifier(k, false);
  }
}

function unbind(keysInfo?: string, method?: Function, scope?: string): void;
function unbind(keysInfo?: object, method?: Function, scope?: string): void;
function unbind(keysInfo?: any, method?: Function, scope?: string): void {
  // unbind(), unbind all keys
  if (typeof keysInfo === "undefined") {
    Object.keys(_handlers).forEach((key) => delete _handlers[key]);
  } else if (Array.isArray(keysInfo)) {
    // support like : unbind([{key: 'ctrl+a', scope: 's1'}, {key: 'ctrl-a', scope: 's2', splitKey: '-'}])
    keysInfo.forEach((info) => {
      if (info.key) eachUnbind(info);
    });
  } else if (typeof keysInfo === "object") {
    // support like unbind({key: 'ctrl+a, ctrl+b', scope:'abc'})
    if (keysInfo.key) eachUnbind(keysInfo);
  } else if (typeof keysInfo === "string") {
    // support old method
    if (method) {
      eachUnbind({
        key: keysInfo,
        scope: scope ? scope : "",
        method,
        splitKey: "+",
      });
    }
  }
}

// Unbind a range of shortcut keys
const eachUnbind = ({
  key,
  scope,
  method,
  splitKey = "+",
}: {
  key: string;
  scope: string;
  method: Function;
  splitKey: string;
}) => {
  const multipleKeys = getKeys(key);
  multipleKeys.forEach((originKey) => {
    const unbindKeys = originKey.split(splitKey);
    const len = unbindKeys.length;
    const lastKey = unbindKeys[len - 1];
    const keyCode = lastKey === "*" ? "*" : code(lastKey);
    if (!_handlers[keyCode]) return;
    // Determine whether the range is passed in, if not, get the range
    if (!scope) scope = getScope();
    const mods = len > 1 ? getMods(_modifier, unbindKeys) : [];
    _handlers[keyCode] = _handlers[keyCode].filter((record) => {
      // Judging by the function, whether to unbind, the function is equal and returns directly
      const isMatchingMethod = method ? record.method === method : true;
      return !(
        isMatchingMethod &&
        record.scope === scope &&
        compareArray(record.mods, mods)
      );
    });
  });
};

// Process the callback function that monitors the corresponding shortcut key
function eventHandler(
  event: KeyboardEvent,
  handler: HandlerItem,
  scope: string,
  element: Document
) {
  if (handler.element !== element) {
    return;
  }
  let modifiersMatch;

  // see if it's in the current scope
  if (handler.scope === scope || handler.scope === "all") {
    // Check if the modifier matches (return true if any)
    modifiersMatch = handler.mods.length > 0;

    for (const y in _mods) {
      if (Object.prototype.hasOwnProperty.call(_mods, y)) {
        if (
          (!_mods[y] && handler.mods.indexOf(+y) > -1) ||
          (_mods[y] && handler.mods.indexOf(+y) === -1)
        ) {
          modifiersMatch = false;
        }
      }
    }

    // Call the handler, if it is a modifier key, no processing
    if (
      (handler.mods.length === 0 && !_mods[18] && !_mods[17] && !_mods[91]) ||
      modifiersMatch ||
      handler.shortcut === "*"
    ) {
      if (handler.method(event, handler) === false) {
        if (event.preventDefault) event.preventDefault();
        else event.returnValue = false;
        if (event.stopPropagation) event.stopPropagation();
        if (event.cancelBubble) event.cancelBubble = true;
      }
    }
  }
}

// Handling keydown events
function dispatch(event: any, element: Document) {
  const asterisk = _handlers["*"];
  let key = event.keyCode || event.which || event.charCode;

  // The command key value of Gecko (Firefox) is 224, which is consistent in Webkit (Chrome)
  // The left and right command keys of Webkit are different
  if (key === 93 || key === 224) key = 91;

  /**
   * Collect bound keys
   * If an Input Method Editor is processing key input and the event is keydown, return 229.
   * https://stackoverflow.com/questions/25043934/is-it-ok-to-ignore-keydown-events-with-keycode-229
   * http://lists.w3.org/Archives/Public/www-dom/2010JulSep/att-0182/keyCode-spec.html
   */
  if (_downKeys.indexOf(key) === -1 && key !== 229) _downKeys.push(key);
  /**
   * Jest test cases are required.
   * ===============================
   */
  ["ctrlKey", "altKey", "metaKey", "shiftKey"].forEach((keyName) => {
    const keyNum = modifierMap[keyName] as number;

    if (event[keyName] && _downKeys.indexOf(keyNum) === -1) {
      _downKeys.push(keyNum);
    } else if (!event[keyName] && _downKeys.indexOf(keyNum) > -1) {
      if (keyName !== "shiftKey") {
        _downKeys.splice(_downKeys.indexOf(keyNum), 1);
      }
    } else if (
      keyName === "metaKey" &&
      event[keyName] &&
      _downKeys.length === 3
    ) {
      /**
       * Fix if Command is pressed:
       * ===============================
       */

      if (!(event.ctrlKey || event.altKey)) {
        _downKeys = _downKeys.slice(_downKeys.indexOf(keyNum));
      }
    }
  });
  /**
   * -------------------------------
   */

  if (key in _mods) {
    _mods[key] = true;

    // Register keys with special characters to hotkeys
    for (const k in _modifier) {
      if (_modifier[k] === key) setModifier(k, true);
    }

    if (!asterisk) return;
  }

  // Bind modifier keys in modifierMap to event
  for (const e in _mods) {
    if (Object.prototype.hasOwnProperty.call(_mods, e)) {
      _mods[e] = event[modifierMap[e] as string];
    }
  }
  /**
   * https://github.com/jaywcjlove/hotkeys/pull/129
   * This solves the issue in Firefox on Windows where hotkeys corresponding to special characters would not trigger.
   * An example of this is ctrl+alt+m on a Swedish keyboard which is used to type μ.
   * Browser support: https://caniuse.com/#feat=keyboardevent-getmodifierstate
   */
  if (
    event.getModifierState &&
    !(event.altKey && !event.ctrlKey) &&
    event.getModifierState("AltGraph")
  ) {
    if (_downKeys.indexOf(17) === -1) {
      _downKeys.push(17);
    }

    if (_downKeys.indexOf(18) === -1) {
      _downKeys.push(18);
    }

    _mods[17] = true;
    _mods[18] = true;
  }

  // get scope defaults to `all`
  const scope = getScope();
  // What to do with any shortcut keys
  if (asterisk) {
    for (let i = 0; i < asterisk.length; i++) {
      if (
        asterisk[i].scope === scope &&
        ((event.type === "keydown" && asterisk[i].keydown) ||
          (event.type === "keyup" && asterisk[i].keyup))
      ) {
        eventHandler(event, asterisk[i], scope, element);
      }
    }
  }
  // key is not returned in _handlers
  if (!(key in _handlers)) return;

  for (let i = 0; i < _handlers[key].length; i++) {
    if (
      (event.type === "keydown" && _handlers[key][i].keydown) ||
      (event.type === "keyup" && _handlers[key][i].keyup)
    ) {
      if (_handlers[key][i].key) {
        const record = _handlers[key][i];
        const { splitKey } = record;
        const keyShortcut = record.key.split(splitKey);
        const _downKeysCurrent = []; // record the current key value
        for (let a = 0; a < keyShortcut.length; a++) {
          _downKeysCurrent.push(code(keyShortcut[a]));
        }
        if (_downKeysCurrent.sort().join("") === _downKeys.sort().join("")) {
          // find processing content
          eventHandler(event, record, scope, element);
        }
      }
    }
  }
}

// Determine if element has bound events
function isElementBind(element: Document) {
  return elementHasBindEvent.indexOf(element) > -1;
}
type Option = {
  scope: string;
  element: Document;
  keyup: boolean;
  keydown: boolean;
  capture: boolean;
  splitKey: string;
};
function hotkeys(hotkeys: string, option: Option, method: Function) {
  _downKeys = [];
  const keyList = getKeys(hotkeys); // Determine if element has bound events
  let mods: number[] = [];
  let scope = "all"; // scope defaults to all, all scopes are valid
  let element = document; // Shortcut key event binding node

  let keyup = false;
  let keydown = true;
  let splitKey = "+";
  let capture = false;

  // Judgment for the set range
  if (method === undefined && typeof option === "function") {
    method = option;
  }

  if (Object.prototype.toString.call(option) === "[object Object]") {
    if (option.scope) scope = option.scope; // eslint-disable-line
    if (option.element) element = option.element; // eslint-disable-line
    if (option.keyup) keyup = option.keyup; // eslint-disable-line
    if (option.keydown !== undefined) keydown = option.keydown; // eslint-disable-line
    if (option.capture !== undefined) capture = option.capture; // eslint-disable-line
    if (typeof option.splitKey === "string") splitKey = option.splitKey; // eslint-disable-line
  }

  if (typeof option === "string") scope = option;

  // for each shortcut key
  for (let i = 0; i < keyList.length; i++) {
    let key = keyList[i].split(splitKey); // key list
    mods = [];

    // If it is a combination shortcut key, get the combination shortcut key
    if (key.length > 1) mods = getMods(_modifier, key);

    // Convert non-modifier keys to keycodes
    let hotkey = key[key.length - 1];
    let keyCode = hotkey === "*" ? "*" : code(hotkey); // * means match all shortcut keys

    // Determine whether the key is in _handlers, if not, assign an empty array
    if (!(keyCode in _handlers)) _handlers[keyCode] = [];
    _handlers[keyCode].push({
      keyup,
      keydown,
      scope,
      mods,
      shortcut: keyList[i],
      method,
      key: keyList[i],
      splitKey,
      element,
    });
  }
  // Set shortcut keys on the global document
  if (typeof element !== "undefined" && !isElementBind(element) && window) {
    elementHasBindEvent.push(element);

    element.addEventListener(
      "keydown",
      (e) => {
        dispatch(e, element);
      },
      capture
    );
    if (!winListendFocus) {
      winListendFocus = true;

      window.addEventListener(
        "focus",
        () => {
          _downKeys = [];
        },
        capture
      );
    }
    element.addEventListener(
      "keyup",
      (e) => {
        dispatch(e, element);
        clearModifier(e);
      },
      capture
    );
  }
}

function trigger(shortcut: string, scope = "all") {
  Object.keys(_handlers).forEach((key) => {
    const data = _handlers[key].find(
      (item) => item.scope === scope && item.shortcut === shortcut
    );
    if (data && data.method) {
      data.method();
    }
  });
}

function setModifier(modifier: string, value: boolean) {
  switch (modifier) {
    case "shift" || "⇧":
      hotkeys.shift = value;
      return;
    case "⌥" || "alt" || "option":
      hotkeys.alt = value;
      return;
    case "⌃" || "ctrl" || "control":
      hotkeys.control = value;
      return;
    case "⌘" || "cmd" || "command":
      hotkeys.command = value;
      return;
  }
}
hotkeys.setScope = setScope;
hotkeys.getScope = getScope;
hotkeys.deleteScope = deleteScope;
hotkeys.getPressedKeyCodes = getPressedKeyCodes;
hotkeys.isPressed = isPressed;
hotkeys.trigger = trigger;
hotkeys.unbind = unbind;
hotkeys.keyMap = _keyMap;
hotkeys.modifier = _modifier;
hotkeys.modifierMap = modifierMap;
hotkeys.command = false;
hotkeys.shift = false;
hotkeys.alt = false;
hotkeys.control = false;

export default hotkeys;
