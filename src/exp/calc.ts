import baseExpChart from '@/data/base-exp-chart.json' with { type: 'json' };
import jobExpChart from '@/data/job-exp-chart-first-class.json' with {
  type: 'json',
};
import {
  type ExpPoint,
  type LevelExpPoint,
  type RawExpPoint,
  isRawExpPoint,
} from '@/exp/types/exp-point';
import { OVERLEVEL_MAX_PERCENTAGE, OVERLEVEL_PROTECTION } from './constants';
import { type MonsterId, monsters } from './monsters';

export type ExpReward = {
  readonly base: number;
  readonly job: number;
};

const emptyExpEntry = [1, { totalExp: 0, expToNextLevel: 0 }] as const;

export const getRawExpPoint = (point: LevelExpPoint): RawExpPoint => {
  const baseLevel = Math.floor(point.baseLvl);
  const basePercentage = point.baseLvl - baseLevel;

  const [, baseLvlExp] =
    Object.entries(baseExpChart)
      .toReversed()
      .find(([level]) => +level === baseLevel) ?? emptyExpEntry;

  const baseExp =
    baseLvlExp.totalExp + baseLvlExp.expToNextLevel * basePercentage;

  const jobLevel = Math.floor(point.jobLvl);
  const jobPercentage = point.jobLvl - jobLevel;

  const [, jobLvlExp] =
    Object.entries(jobExpChart)
      .toReversed()
      .find(([level]) => +level === jobLevel) ?? emptyExpEntry;

  const jobExp = jobLvlExp.totalExp + jobLvlExp.expToNextLevel * jobPercentage;

  return {
    baseExp,
    jobExp,
  };
};

export const getLevelExpPoint = (point: RawExpPoint): LevelExpPoint => {
  const [baseLvl, baseLvlExp] =
    Object.entries(baseExpChart)
      .toReversed()
      .find(([, { totalExp }]) => totalExp < point.baseExp) ?? emptyExpEntry;

  const remainingExp = point.baseExp - baseLvlExp.totalExp;
  const percentage = baseLvlExp.expToNextLevel
    ? remainingExp / baseLvlExp.expToNextLevel
    : 0;

  const [jobLvl, jobLvlExp] =
    Object.entries(jobExpChart)
      .toReversed()
      .find(([, { totalExp }]) => totalExp < point.jobExp) ?? emptyExpEntry;

  const remainingExpJob = point.jobExp - jobLvlExp.totalExp;
  const percentageJob = jobLvlExp.expToNextLevel
    ? remainingExpJob / jobLvlExp.expToNextLevel
    : 0;

  return {
    baseLvl: +baseLvl + percentage,
    jobLvl: +jobLvl + percentageJob,
  };
};

export const calcMonsterCount = (
  start: ExpPoint,
  target: ExpPoint,
  monsterId: MonsterId,
): [number, RawExpPoint] => {
  const monster = monsters[monsterId];
  const startRawExp = isRawExpPoint(start) ? start : getRawExpPoint(start);
  const targetRawExp = isRawExpPoint(target) ? target : getRawExpPoint(target);

  const baseCount = targetRawExp.baseExp
    ? (targetRawExp.baseExp - startRawExp.baseExp) / monster.base
    : 0;
  const jobCount = targetRawExp.jobExp
    ? (targetRawExp.jobExp - startRawExp.jobExp) / monster.job
    : 0;

  const count = Math.ceil(Math.max(baseCount, jobCount));
  const baseExp = count * monster.base;
  const jobExp = count * monster.job;

  return [
    count,
    {
      baseExp,
      jobExp,
    },
  ];
};

export const willOverlevel = (
  expPoint: ExpPoint,
  expReward: ExpReward,
): { readonly base: boolean; readonly job: boolean } => {
  if (!OVERLEVEL_PROTECTION) {
    return { base: false, job: false };
  }

  const [expRaw, expLevel] = isRawExpPoint(expPoint)
    ? [expPoint, getLevelExpPoint(expPoint)]
    : [getRawExpPoint(expPoint), expPoint];

  const targetExp: RawExpPoint = {
    baseExp: expRaw.baseExp + expReward.base,
    jobExp: expRaw.jobExp + expReward.job,
  };

  const overlevel = OVERLEVEL_MAX_PERCENTAGE / 100 + 1;

  const targetLevel = getLevelExpPoint(targetExp);
  const capLevelBase = Math.floor(expLevel.baseLvl) + overlevel;
  const capLevelJob = Math.floor(expLevel.jobLvl) + overlevel;

  return {
    base: targetLevel.baseLvl > capLevelBase,
    job: targetLevel.jobLvl > capLevelJob,
  };
};
