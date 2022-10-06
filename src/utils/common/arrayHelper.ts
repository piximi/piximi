export const getLastItem = (arr: Array<any>) => {
  if (!arr.length) {
    return;
  }
  return arr[arr.length - 1];
};
