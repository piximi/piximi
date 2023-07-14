/*
 * This is a concatenation of tfjs History objects returned by .train()
 * aross training cycles, where each cycle is every time the user presses
 * the "Fit" button (with a variable number of epochs per cycle)
 */
export type ModelHistory = {
  // [0, 1, ..., numEpochs1, 0, 1, ..., numEpochs2, ...]
  // where numEpochs1 and numEpochs2 are the number of epochs set in
  // training cycles 1 and 2
  epochs: Array<number>;
  // dict i represents training cycle i
  // in the dict, each key has an array whos length is equal to the
  // number of epochs in training cycle i
  // keys are metrics, e.g. [val_]categoricalAccuracy, [val_]loss
  history: Array<{
    [key: string]: Array<number>;
  }>;
};
