/**
 * Generates a random integer between two values.
 * @param min - The minimum possible returned value (inclusive)
 * @param max - The maximum number (exclusive)
 * @returns The largest integer less than or equal to the given maximum value.
 */
export const getRandomInt = (min: number, max: number) => {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
};
