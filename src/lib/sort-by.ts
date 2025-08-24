export type SortBy<TProp = unknown> = (a: TProp, b: TProp) => number;

export const sortByDesc =
  <TProp>(sortBy: SortBy<TProp>) =>
  (a: TProp, b: TProp): number =>
    sortBy(b, a);

type SortByPropArgs<TData, TProp> = {
  readonly select: (data: TData) => TProp;
  readonly compare: SortBy<TProp>;
};

export const sortByProp =
  <TData, TProp = unknown>({
    select,
    compare,
  }: SortByPropArgs<TData, TProp>): SortBy<TData> =>
  (a, b) => {
    const propA = select(a);
    const propB = select(b);

    return compare(propA, propB);
  };

export const numericallyAsc: SortBy<number> = (a, b) => a - b;
export const numericallyDesc = sortByDesc(numericallyAsc);
