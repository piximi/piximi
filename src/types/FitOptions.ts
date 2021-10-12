export type FitOptions = {
  epochs: number;
  batchSize: number;
  initialEpoch: number;
  test_data_size?: number;
  train_data_size?: number;
  shuffle: boolean;
};
