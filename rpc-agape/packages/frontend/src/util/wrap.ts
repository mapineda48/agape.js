function wrap<R = unknown>(target: {}, cb: <T>(current: T) => unknown) {
  return Object.fromEntries(
    Object.entries(target).map(([key, value]) => [key, cb(value)])
  ) as R;
}

export default wrap;

export type WrapFC<T, E> = {
  [K in keyof T]: T[K] extends (props: infer P) => infer R
    ? (props: P & E) => R
    : never;
};
