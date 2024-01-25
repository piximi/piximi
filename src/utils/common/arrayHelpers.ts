export const getDifference = <T>(list1: T[], list2: T[]) => {
  // Create sets for each list
  const set1 = new Set(list1);
  const set2 = new Set(list2);

  // Use the spread operator to create a union set of unique numbers from both lists
  const unionSet = new Set([...set1, ...set2]);

  // Use the filter method to get only the numbers that appear in only one set
  const uniqueNumbers = [...unionSet].filter(
    (num) => !(set1.has(num) && set2.has(num))
  );

  return uniqueNumbers;
};
