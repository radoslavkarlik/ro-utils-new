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
import type { ExpReward } from '@/exp/types/exp-reward';
import { OVERLEVEL_PROTECTION } from './constants';
import type { Monster } from './monsters';

const maxBaseLevel = Number(Object.keys(baseExpChart).toReversed()[0]) || 1;
const maxJobLevel = Number(Object.keys(jobExpChart).toReversed()[0]) || 1;

const emptyExpEntry = [1, { totalExp: 0, expToNextLevel: 0 }] as const;

export const getRawExpPoint = (point: LevelExpPoint): RawExpPoint => {
  return {
    baseExp: getBaseExp(point.baseLvl),
    jobExp: getJobExp(point.jobLvl),
  };
};

export const getBaseExp = (baseLvl: number): number => {
  const wholeLevel = Math.floor(baseLvl);
  const percentage = baseLvl - wholeLevel;

  const [, baseLvlExp] =
    Object.entries(baseExpChart)
      .toReversed()
      .find(([level]) => +level === wholeLevel) ?? emptyExpEntry;

  return baseLvlExp.totalExp + baseLvlExp.expToNextLevel * percentage;
};

export const getJobExp = (jobLvl: number): number => {
  const wholeLevel = Math.floor(jobLvl);
  const percentage = jobLvl - wholeLevel;

  const [, jobLvlExp] =
    Object.entries(jobExpChart)
      .toReversed()
      .find(([level]) => +level === wholeLevel) ?? emptyExpEntry;

  return jobLvlExp.totalExp + jobLvlExp.expToNextLevel * percentage;
};

export const getLevelExpPoint = (point: RawExpPoint): LevelExpPoint => {
  return {
    baseLvl: getBaseLevel(point.baseExp),
    jobLvl: getJobLevel(point.jobExp),
  };
};

export const getBaseLevel = (baseExp: number): number => {
  const [baseLvl, baseLvlExp] =
    Object.entries(baseExpChart)
      .toReversed()
      .find(([, { totalExp }]) => totalExp < baseExp) ?? emptyExpEntry;

  const remainingExp = baseExp - baseLvlExp.totalExp;
  const percentage = baseLvlExp.expToNextLevel
    ? remainingExp / baseLvlExp.expToNextLevel
    : 0;

  return +baseLvl + percentage;
};

export const getJobLevel = (jobExp: number): number => {
  const [jobLvl, jobLvlExp] =
    Object.entries(jobExpChart)
      .toReversed()
      .find(([, { totalExp }]) => totalExp < jobExp) ?? emptyExpEntry;

  const remainingExpJob = jobExp - jobLvlExp.totalExp;
  const percentageJob = jobLvlExp.expToNextLevel
    ? remainingExpJob / jobLvlExp.expToNextLevel
    : 0;

  return +jobLvl + percentageJob;
};

export const calcMonsterCount = (
  start: ExpPoint,
  target: ExpPoint,
  monster: Monster,
): [number, ExpReward] => {
  const startRawExp = isRawExpPoint(start) ? start : getRawExpPoint(start);
  const targetRawExp = isRawExpPoint(target) ? target : getRawExpPoint(target);

  const baseCount =
    Math.max(0, targetRawExp.baseExp - startRawExp.baseExp) /
    monster.reward.base;

  const jobCount =
    Math.max(0, targetRawExp.jobExp - startRawExp.jobExp) / monster.reward.job;

  const count = Math.ceil(Math.max(baseCount, jobCount));
  const base = count * monster.reward.base;
  const job = count * monster.reward.job;

  return [
    count,
    {
      base,
      job,
    },
  ];
};

export const capExpReward = (
  startRaw: RawExpPoint,
  startLevel: LevelExpPoint,
  expReward: ExpReward,
): ExpReward => {
  return {
    base: capExpRewardBase(
      startRaw.baseExp,
      startLevel.baseLvl,
      expReward.base,
    ),
    job: capExpRewardJob(startRaw.jobExp, startLevel.jobLvl, expReward.job),
  };
};

export const capExpRewardBase = (
  startRawBase: number,
  startLevelBase: number,
  expRewardBase: number,
): number => {
  const { expToNextLevel: expToNextLevelJob, totalExp: totalExpJob } =
    baseExpChart[Math.floor(startLevelBase) as keyof typeof jobExpChart];

  const capExpJob = 2 * expToNextLevelJob - (startRawBase - totalExpJob) - 1;

  return Math.min(expRewardBase, capExpJob);
};

export const capExpRewardJob = (
  startRawJob: number,
  startLevelJob: number,
  expRewardJob: number,
): number => {
  const { expToNextLevel: expToNextLevelJob, totalExp: totalExpJob } =
    jobExpChart[Math.floor(startLevelJob) as keyof typeof jobExpChart];

  const capExpJob = 2 * expToNextLevelJob - (startRawJob - totalExpJob) - 1;

  return Math.min(expRewardJob, capExpJob);
};

export const willOverlevel = (
  expPoint: ExpPoint,
  expReward: ExpReward,
): {
  readonly base: boolean;
  readonly job: boolean;
  reachedMaxBase: boolean;
  reachedMaxJob: boolean;
} => {
  if (!OVERLEVEL_PROTECTION) {
    return {
      base: false,
      job: false,
      reachedMaxBase: false,
      reachedMaxJob: false,
    };
  }

  const [expRaw, expLevel] = isRawExpPoint(expPoint)
    ? [expPoint, getLevelExpPoint(expPoint)]
    : [getRawExpPoint(expPoint), expPoint];

  const targetExp: RawExpPoint = {
    baseExp: expRaw.baseExp + expReward.base,
    jobExp: expRaw.jobExp + expReward.job,
  };

  const targetLevel = getLevelExpPoint(targetExp);

  const { base: capRewardBase, job: capRewardJob } = capExpReward(
    expRaw,
    expLevel,
    expReward,
  );

  // TODO log exp was wasted but hit max job level
  return {
    base: expReward.base > capRewardBase,
    job: expReward.job > capRewardJob,
    reachedMaxBase: targetLevel.baseLvl === maxBaseLevel,
    reachedMaxJob: targetLevel.jobLvl === maxJobLevel,
  };
};

export const applyRates = (expReward: ExpReward, rates: number): ExpReward => ({
  base: Math.floor(expReward.base * rates),
  job: Math.floor(expReward.job * rates),
});

export const meetsExpRequirements = (
  current: RawExpPoint,
  requirements: RawExpPoint,
): boolean => {
  const targetRaw = isRawExpPoint(requirements)
    ? requirements
    : getRawExpPoint(requirements);

  return (
    current.baseExp >= targetRaw.baseExp && current.jobExp >= targetRaw.jobExp
  );
};

export const getMinLevelExpPoint = (
  level: LevelExpPoint,
  other: LevelExpPoint,
): LevelExpPoint => ({
  baseLvl: Math.min(level.baseLvl, other.baseLvl),
  jobLvl: Math.min(level.jobLvl, other.jobLvl),
});
