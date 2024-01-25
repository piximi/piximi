export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<T>;
export type RequireField<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;
