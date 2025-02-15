import baseExpChart from '@/data/base-exp-chart.json' with { type: 'json' };
import jobExpChart from '@/data/job-exp-chart-first-class.json' with {
  type: 'json',
};
import { type ExpReward, willOverlevel } from '@/exp/calc';
import { OVERLEVEL_PROTECTION } from '@/exp/constants';
import type { LevelExpPoint } from '@/exp/types/exp-point';

export const findMinimumLevelForExpReward = (
  reward: ExpReward | ReadonlyArray<ExpReward>,
): LevelExpPoint => {
  if (!OVERLEVEL_PROTECTION) {
    return {
      baseLvl: 1,
      jobLvl: 1,
    };
  }

  const rewards: ReadonlyArray<ExpReward> = Array.isArray(reward)
    ? reward
    : [reward];

  const overlevelMinBase = ((): number => {
    let totalExp = 0;

    levelLoop: for (const [bLvl, baseExp] of Object.entries(baseExpChart)) {
      totalExp = baseExp.totalExp;

      for (const reward of rewards) {
        if (willOverlevel({ baseExp: totalExp, jobExp: 0 }, reward).base) {
          continue levelLoop;
        }

        totalExp += reward.base;
      }

      return +bLvl;
    }

    return Number.POSITIVE_INFINITY;
  })();

  const overlevelMinJob = ((): number => {
    let totalExp = 0;

    levelLoop: for (const [jLvl, jobExp] of Object.entries(jobExpChart)) {
      totalExp = jobExp.totalExp;

      for (const reward of rewards) {
        if (willOverlevel({ baseExp: 0, jobExp: totalExp }, reward).job) {
          continue levelLoop;
        }

        totalExp += reward.job;
      }

      return +jLvl;
    }

    return Number.POSITIVE_INFINITY;
  })();

  return {
    baseLvl: overlevelMinBase,
    jobLvl: overlevelMinJob,
  };
};
