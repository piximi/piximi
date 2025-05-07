export const pluralize = (word: string, count: number) => {
  return `${count > 1 ? word + "s" : word}`;
};

/*
 * Method to rename a string if a string with this name already exists in a collection
 * Returns a unique name by appending a number to the end of the string
 * If a formatter is provided, it will be used to format the new name
 * Otherwise, the default formatter will be used
 *
 * @param name - The name to rename
 * @param existingNames - The collection of existing names
 * @param formatter - The formatter to use for the new name
 */

export const getUniqueName = (
  name: string,
  existingNames: Array<string>,
  formatter: (base: string, index: number) => string = (base, n) =>
    `${base}_${n}`,
) => {
  const nameSet = new Set(existingNames);
  if (!nameSet.has(name)) return name;

  let index = 1;
  let newName = `${name}_${index}`;
  while (nameSet.has(newName)) {
    index++;
    newName = formatter(name, index);
  }
  return newName;
};

export const capitalize = (input: string) => {
  const capitalized: string[] = [];

  const words = input.split(" ");

  words.forEach((word) => {
    capitalized.push(word.charAt(0).toUpperCase() + word.slice(1));
  });
  return capitalized.join(" ");
};

export const formatString = (
  string: string,
  splitKey: string,
  capitalize?: "first-word" | "every-word" | "every-letter",
) => {
  const splitString = string.split(splitKey);
  if (!capitalize) return splitString.join(" ");
  switch (capitalize) {
    case "first-word":
      splitString[0] =
        splitString[0][0].toLocaleUpperCase() +
        splitString[0].slice(1, splitString[0].length);
      return splitString.join(" ");
    case "every-word":
      return splitString
        .map((word) => word[0].toLocaleUpperCase() + word.slice(1, word.length))
        .join(" ");
    case "every-letter":
      return splitString.join(" ").toLocaleUpperCase();
  }
};
