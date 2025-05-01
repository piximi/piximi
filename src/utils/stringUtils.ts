export const pluralize = (word: string, count: number) => {
  return `${count > 1 ? word + "s" : word}`;
};

/*
 * Method to rename a cateogry/image if a category/image with this name already exists
 */
export const replaceDuplicateName = (
  newName: string,
  existingNames: Array<string>,
) => {
  let currentName = newName;
  let i = 1;
  while (existingNames.includes(currentName)) {
    currentName = newName + `_${i}`;
    i += 1;
  }
  return currentName;
};

//HACK: new
export const newReplaceDuplicateName = (
  newName: string,
  existingNames: Array<string>,
) => {
  const currentName = newName;
  let count = 0;
  // eslint-disable-next-line
  const nameRe = new RegExp(`${newName}(_\d+)?`, "g");
  existingNames.forEach((name) => {
    if (nameRe.exec(name)) {
      const suffix = +name.split("_")[1];
      if (suffix > count) {
        count = suffix;
      }
    }
  });
  return !count ? currentName : `${currentName}_${count + 1}`;
};

export const capitalize = (input: string) => {
  const capitalized: string[] = [];

  const words = input.split(" ");

  words.forEach((word) => {
    capitalized.push(word.charAt(0).toUpperCase() + word.slice(1));
  });
  return capitalized.join(" ");
};
