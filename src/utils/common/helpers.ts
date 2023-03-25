export function mutatingFilter<T>(
  array: Array<T>,
  condition: (arg: T) => boolean
): void {
  for (let l = array.length - 1; l >= 0; l -= 1) {
    if (!condition(array[l])) array.splice(l, 1);
  }
}
