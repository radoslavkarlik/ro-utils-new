import baseExpChart from '@/data/base-exp-chart.json' with { type: 'json' };
import jobExpChart from '@/data/job-exp-chart-first-class.json' with {
  type: 'json',
};
import { getLevelExpPoint, getRawExpPoint, willOverlevel } from '@/exp/calc';
import { MIN_EXP_REWARD, OVERLEVEL_PROTECTION } from '@/exp/constants';
import type { Monster } from '@/exp/monsters';
import type { LevelExpPoint, RawExpPoint } from '@/exp/types/exp-point';
import type { ExpReward } from '@/exp/types/exp-reward';
import { getRewardsArray } from '@/exp/types/quest';

export const findMinimumLevelForExpReward = (
  reward: ExpReward | ReadonlyArray<ExpReward>,
  getMonster?: (maxBaseLevel: number) => Monster,
  startingExp?: RawExpPoint,
): [
  LevelExpPoint,
  { readonly reachedMaxBase: boolean; readonly reachedMaxJob: boolean },
] => {
  const rewards = getRewardsArray(reward);
  const allRewardsResult = _findMinimumLevelForExpReward(rewards);

  if (!getMonster || rewards.length === 1) {
    return allRewardsResult;
  }

  const [allRewardsExp] = allRewardsResult;

  const monster = getMonster(allRewardsExp.baseLvl);
  const endExp = getRawExpPoint(allRewardsExp);

  const [baseLvl, reachedMaxBase] = ((): [number, boolean] => {
    const [startExp, reachedMaxBase] = ((): [RawExpPoint, boolean] => {
      if (startingExp) {
        return [startingExp, false];
      }

      const firstBaseReward = rewards.find(
        (reward) => reward.base > MIN_EXP_REWARD,
      );

      const firstRewardResult = _findMinimumLevelForExpReward(
        firstBaseReward ? [firstBaseReward] : [],
      );
      const [firstRewardExp, { reachedMaxBase }] = firstRewardResult;

      return [getRawExpPoint(firstRewardExp), reachedMaxBase];
    })();

    if (reachedMaxBase) {
      return [getLevelExpPoint(startExp).baseLvl, true];
    }

    expLoop: for (
      let baseExp = startExp.baseExp;
      baseExp <= endExp.baseExp;
      baseExp += monster.reward.base
    ) {
      let currentBaseExp = baseExp;

      for (const reward of rewards) {
        const { base, reachedMaxBase } = willOverlevel(
          { baseExp: currentBaseExp, jobExp: 0 },
          reward,
        );

        if (reachedMaxBase) {
          return [getLevelExpPoint({ baseExp, jobExp: 0 }).baseLvl, true];
        }

        if (base) {
          continue expLoop;
        }

        currentBaseExp += reward.base;
      }

      return [getLevelExpPoint({ baseExp, jobExp: 0 }).baseLvl, false];
    }

    return [allRewardsExp.baseLvl, false];
  })();

  const [jobLvl, reachedMaxJob] = ((): [number, boolean] => {
    const [startExp, reachedMaxJob] = ((): [RawExpPoint, boolean] => {
      if (startingExp) {
        return [startingExp, false];
      }

      const firstJobReward = rewards.find(
        (reward) => reward.job > MIN_EXP_REWARD,
      );

      const firstRewardResult = _findMinimumLevelForExpReward(
        firstJobReward ? [firstJobReward] : [],
      );
      const [firstRewardExp, { reachedMaxJob }] = firstRewardResult;

      return [getRawExpPoint(firstRewardExp), reachedMaxJob];
    })();

    if (reachedMaxJob) {
      return [getLevelExpPoint(startExp).jobLvl, true];
    }

    expLoop: for (
      let jobExp = startExp.jobExp;
      jobExp <= endExp.jobExp;
      jobExp += monster.reward.job
    ) {
      let currentJobExp = jobExp;

      for (const reward of rewards) {
        const { job, reachedMaxJob } = willOverlevel(
          { baseExp: 0, jobExp: currentJobExp },
          reward,
        );

        if (reachedMaxJob) {
          return [getLevelExpPoint({ baseExp: 0, jobExp }).jobLvl, true];
        }

        if (job) {
          continue expLoop;
        }

        currentJobExp += reward.job;
      }

      return [getLevelExpPoint({ baseExp: 0, jobExp }).jobLvl, false];
    }

    return [allRewardsExp.jobLvl, false];
  })();

  return [
    {
      baseLvl,
      jobLvl,
    },
    {
      reachedMaxBase,
      reachedMaxJob,
    },
  ];
};

const _findMinimumLevelForExpReward = (
  rewards: ReadonlyArray<ExpReward>,
): [
  LevelExpPoint,
  { readonly reachedMaxBase: boolean; readonly reachedMaxJob: boolean },
] => {
  if (!OVERLEVEL_PROTECTION) {
    return [
      {
        baseLvl: 1,
        jobLvl: 1,
      },
      {
        reachedMaxBase: false,
        reachedMaxJob: false,
      },
    ];
  }

  const [overlevelMinBase, reachedMaxBase] = ((): [number, boolean] => {
    let totalExp = 0;

    levelLoop: for (const [bLvl, baseExp] of Object.entries(baseExpChart)) {
      totalExp = baseExp.totalExp;

      for (const reward of rewards) {
        const { base, reachedMaxBase } = willOverlevel(
          { baseExp: totalExp, jobExp: 0 },
          reward,
        );

        if (reachedMaxBase) {
          return [+bLvl, true];
        }

        if (base) {
          continue levelLoop;
        }

        totalExp += reward.base;
      }

      return [+bLvl, false];
    }

    return [Number.POSITIVE_INFINITY, false];
  })();

  const [overlevelMinJob, reachedMaxJob] = ((): [number, boolean] => {
    let totalExp = 0;

    levelLoop: for (const [jLvl, jobExp] of Object.entries(jobExpChart)) {
      totalExp = jobExp.totalExp;

      for (const reward of rewards) {
        const { job, reachedMaxJob } = willOverlevel(
          { baseExp: 0, jobExp: totalExp },
          reward,
        );

        if (reachedMaxJob) {
          return [+jLvl, true];
        }

        if (job) {
          continue levelLoop;
        }

        totalExp += reward.job;
      }

      return [+jLvl, false];
    }

    return [Number.POSITIVE_INFINITY, false];
  })();

  return [
    {
      baseLvl: overlevelMinBase,
      jobLvl: overlevelMinJob,
    },
    {
      reachedMaxBase,
      reachedMaxJob,
    },
  ];
};
