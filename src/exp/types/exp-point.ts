import { getBaseExp, getJobExp } from '@/exp/calc';

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

export const emptyRawExp: RawExpPoint = {
  baseExp: 0,
  jobExp: 0,
};

export const subtractRawExp = (
  exp: RawExpPoint,
  other: RawExpPoint,
): RawExpPoint => ({
  baseExp: exp.baseExp - other.baseExp,
  jobExp: exp.jobExp - other.jobExp,
});

export const getRawExpPoint = (point: LevelExpPoint): RawExpPoint => ({
  baseExp: getBaseExp(point.baseLvl),
  jobExp: getJobExp(point.jobLvl),
});
