export type FilterType<T> = {
  [K in keyof T]?: Array<T[K]>;
};
