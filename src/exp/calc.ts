import baseExpChart from '@/data/base-exp-chart.json' with { type: 'json' };
import jobExpChart from '@/data/job-exp-chart-first-class.json' with {
  type: 'json',
};
import type { ExpReward } from '@/exp/types/exp-reward';
import type { Monster } from './monsters';
import type { Exp } from '@/exp/types/exp';

export const maxBaseLevel =
  Number(Object.keys(baseExpChart).toReversed()[0]) || 1;
export const maxJobLevel =
  Number(Object.keys(jobExpChart).toReversed()[0]) || 1;

const emptyExpEntry = [1, { totalExp: 0, expToNextLevel: 0 }] as const;

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
  start: Exp,
  target: Exp,
  monster: Monster,
): [number, ExpReward] => {
  const startRawExp = start.raw;
  const targetRawExp = target.raw;

  const baseCount =
    Math.max(0, targetRawExp.baseExp - startRawExp.baseExp) /
    monster.reward.base;

  const jobCount =
    Math.max(0, targetRawExp.jobExp - startRawExp.jobExp) / monster.reward.job;

  const count = Math.ceil(Math.max(baseCount, jobCount));
  const reward = applyRates(monster.reward, count);

  return [count, reward];
};

export const capExpReward = (exp: Exp, expReward: ExpReward): ExpReward => {
  return {
    base: capExpRewardBase(exp, expReward.base),
    job: capExpRewardJob(exp, expReward.job),
  };
};

export const capExpRewardBase = (exp: Exp, expRewardBase: number): number => {
  const { expToNextLevel: expToNextLevelBase, totalExp: totalExpBase } =
    baseExpChart[
      Math.floor(exp.level.baseLvl) as unknown as keyof typeof baseExpChart
    ];

  const capExpBase = Math.max(
    0,
    2 * expToNextLevelBase - (exp.raw.baseExp - totalExpBase) - 1,
  );

  return Math.min(expRewardBase, capExpBase);
};

export const capExpRewardJob = (exp: Exp, expRewardJob: number): number => {
  const { expToNextLevel: expToNextLevelJob, totalExp: totalExpJob } =
    jobExpChart[
      Math.floor(exp.level.jobLvl) as unknown as keyof typeof jobExpChart
    ];

  const capExpJob = Math.max(
    0,
    2 * expToNextLevelJob - (exp.raw.jobExp - totalExpJob) - 1,
  );

  return Math.min(expRewardJob, capExpJob);
};

export const applyRates = (expReward: ExpReward, rates: number): ExpReward => ({
  base: Math.floor(expReward.base * rates),
  job: Math.floor(expReward.job * rates),
});

export const meetsExpRequirements = (
  current: Exp,
  requirements: Exp,
): boolean => {
  return (
    current.raw.baseExp >= requirements.raw.baseExp &&
    current.raw.jobExp >= requirements.raw.jobExp
  );
};
