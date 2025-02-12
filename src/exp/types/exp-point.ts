export type RawExpPoint = {
  readonly baseExp: number;
  readonly jobExp: number;
};

export type LevelExpPoint = {
  readonly baseLvl: number;
  readonly jobLvl: number;
};

export type ExpPoint = RawExpPoint | LevelExpPoint;

export const isRawExpPoint = (point: Partial<ExpPoint>): point is RawExpPoint =>
  'baseExp' in point;
