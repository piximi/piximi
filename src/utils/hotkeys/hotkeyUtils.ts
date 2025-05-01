import { HotkeyHandlerItem } from "../types";

const isff =
  typeof navigator !== "undefined"
    ? navigator.userAgent.toLowerCase().indexOf("firefox") > 0
    : false;

// Convert modifier keys to corresponding key codes
function getMods(modifier: Record<string, number>, key: string[]) {
  const mod_names = key.slice(0, key.length - 1);
  const mod_keys = [];
  for (let i = 0; i < mod_names.length; i++)
    mod_keys.push(modifier[mod_names[i].toLowerCase()]);
  return mod_keys;
}

// Convert the passed key string to an array
function getKeys(key: string) {
  key = key.replace(/\s/g, ""); // matches any whitespace character, including spaces, tabs, form feeds, etc.
  const keys = key.split(","); // Set multiple shortcut keys at the same time, separated by ','
  let index = keys.lastIndexOf("");

  // Shortcut keys may contain ',', special handling is required
  for (; index >= 0; ) {
    keys[index - 1] += ",";
    keys.splice(index, 1);
    index = keys.lastIndexOf("");
  }

  return keys;
}

// Compare arrays of modifier keys
function compareArray(a1: number[], a2: number[]) {
  const arr1 = a1.length >= a2.length ? a1 : a2;
  const arr2 = a1.length >= a2.length ? a2 : a1;
  let isIndex = true;

  for (let i = 0; i < arr1.length; i++) {
    if (arr2.indexOf(arr1[i]) === -1) isIndex = false;
  }
  return isIndex;
}

const _keyMap: Record<string, number> = {
  backspace: 8,
  "⌫": 8,
  tab: 9,
  clear: 12,
  enter: 13,
  "↩": 13,
  return: 13,

  esc: 27,
  escape: 27,
  space: 32,
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  del: 46,
  delete: 46,
  ins: 45,
  insert: 45,
  home: 36,
  end: 35,
  pageup: 33,
  pagedown: 34,
  capslock: 20,
  num_0: 96,
  num_1: 97,
  num_2: 98,
  num_3: 99,
  num_4: 100,
  num_5: 101,
  num_6: 102,
  num_7: 103,
  num_8: 104,
  num_9: 105,
  num_multiply: 106,
  num_add: 107,
  num_enter: 108,
  num_subtract: 109,
  num_decimal: 110,
  num_divide: 111,
  "⇪": 20,
  ",": 188,
  ".": 190,
  "/": 191,
  "`": 192,
  "-": isff ? 173 : 189,
  "=": isff ? 61 : 187,
  ";": isff ? 59 : 186,
  "'": 222,
  "[": 219,
  "]": 221,
  "\\": 220,
};

// Modifier Keys
const _modifier: Record<string, number> = {
  "⇧": 16,
  shift: 16,
  // altKey
  "⌥": 18,
  alt: 18,
  option: 18,
  // ctrlKey
  "⌃": 17,
  ctrl: 17,
  control: 17,
  // metaKey
  "⌘": 91,
  cmd: 91,
  command: 91,
};
const modifierMap: Record<string | number, string | number> = {
  16: "shiftKey",
  18: "altKey",
  17: "ctrlKey",
  91: "metaKey",

  shiftKey: 16,
  ctrlKey: 17,
  altKey: 18,
  metaKey: 91,
};
const _mods: Record<number, boolean> = {
  18: false,
  17: false,
  91: false,
};

const _handlers: Record<string | number, HotkeyHandlerItem[]> = {};

const getCode = (x: string) =>
  _keyMap[x.toLowerCase()] ||
  _modifier[x.toLowerCase()] ||
  x.toUpperCase().charCodeAt(0);

// F1~F12 special key
for (let k = 1; k < 20; k++) {
  _keyMap[`f${k}`] = 111 + k;
}

export {
  _keyMap,
  _modifier,
  modifierMap,
  _mods,
  _handlers,
  isff,
  getMods,
  getKeys,
  compareArray,
  getCode,
};
