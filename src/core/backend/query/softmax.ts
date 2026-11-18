/* How sure a prediction is: the gap between its top two class probabilities. */
export const marginOf = (softmax: number[]): number => {
  let top1 = -Infinity;
  let top2 = -Infinity;
  for (const p of softmax) {
    if (p > top1) {
      top2 = top1;
      top1 = p;
    } else if (p > top2) {
      top2 = p;
    }
  }
  return (top1 === -Infinity ? 0 : top1) - (top2 === -Infinity ? 0 : top2);
};
