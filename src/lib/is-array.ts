export const isArray = <T>(value: unknown): value is ReadonlyArray<T> =>
  Array.isArray(value);
