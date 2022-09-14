// https://stackoverflow.com/questions/55105558/is-there-a-way-i-can-get-the-return-type-of-the-generator-function
export type GeneratorReturnType<T extends Generator> = T extends Generator<
  any,
  infer R,
  any
>
  ? R
  : never;
