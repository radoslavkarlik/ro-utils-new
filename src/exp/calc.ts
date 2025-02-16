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
import type { MonsterId } from '@/exp/types/monster-id';
import { numericallyAsc, sortByProp } from '@/lib/sort-by';
import { OVERLEVEL_PROTECTION } from './constants';
import { monsters } from './monsters';

const maxBaseLevel = Number(Object.keys(baseExpChart).toReversed()[0]) || 1;
const maxJobLevel = Number(Object.keys(jobExpChart).toReversed()[0]) || 1;

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

export const capExpReward = (
  startRaw: RawExpPoint,
  startLevel: LevelExpPoint,
  expReward: ExpReward,
): ExpReward => {
  const { expToNextLevel: expToNextLevelBase, totalExp: totalExpBase } =
    baseExpChart[Math.floor(startLevel.baseLvl) as keyof typeof baseExpChart];
  const { expToNextLevel: expToNextLevelJob, totalExp: totalExpJob } =
    jobExpChart[Math.floor(startLevel.jobLvl) as keyof typeof jobExpChart];

  const capExpBase =
    2 * expToNextLevelBase - (startRaw.baseExp - totalExpBase) - 1;
  const capExpJob = 2 * expToNextLevelJob - (startRaw.jobExp - totalExpJob) - 1;

  return {
    base: Math.min(expReward.base, capExpBase),
    job: Math.min(expReward.job, capExpJob),
  };
};

export const willOverlevel = (
  expPoint: ExpPoint,
  expReward: ExpReward,
): {
  readonly base: boolean;
  readonly job: boolean;
  ignoreOverLevel: boolean;
} => {
  if (!OVERLEVEL_PROTECTION) {
    return { base: false, job: false, ignoreOverLevel: false };
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
    base:
      targetLevel.baseLvl !== maxBaseLevel && expReward.base > capRewardBase,
    job: targetLevel.jobLvl !== maxJobLevel && expReward.job > capRewardJob,
    ignoreOverLevel:
      targetLevel.baseLvl === maxBaseLevel ||
      targetLevel.jobLvl === maxJobLevel,
  };
};

export const getMonsterBaseLvlThresholds = (
  monsterIds: ReadonlyArray<MonsterId>,
): ReadonlyArray<[MonsterId, number]> =>
  monsterIds
    .map((monsterId) => monsters[monsterId])
    .sort(
      sortByProp({
        select: (monster) => monster.prerequisite?.baseLevel ?? 1,
        compare: numericallyAsc,
      }),
    )
    .map((monster) => [monster.id, monster.prerequisite?.baseLevel ?? 1]);
