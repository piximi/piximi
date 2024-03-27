export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<T>;
export type RequireField<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type RequireOnly<T, K extends keyof T> = Partial<Omit<T, K>> &
  Required<Pick<T, K>>;
