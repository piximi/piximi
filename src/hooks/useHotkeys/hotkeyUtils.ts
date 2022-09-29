const isff =
  typeof navigator !== "undefined"
    ? navigator.userAgent.toLowerCase().indexOf("firefox") > 0
    : false;

// Convert modifier keys to corresponding key codes
function getMods(modifier: Record<string, number>, key: string[]) {
  const mod_names = key.slice(0, key.length - 1);
  let mod_keys = [];
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

export { isff, getMods, getKeys, compareArray };
