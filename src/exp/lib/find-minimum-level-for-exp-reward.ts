import baseExpChart from '@/data/base-exp-chart.json' with { type: 'json' };
import jobExpChart from '@/data/job-exp-chart-first-class.json' with {
  type: 'json',
};
import type { ExpReward } from '@/exp/calc';
import {
  OVERLEVEL_MAX_PERCENTAGE,
  OVERLEVEL_PROTECTION,
} from '@/exp/constants';
import type { LevelExpPoint } from '@/exp/types/exp-point';

export const findMinimumLevelForExpReward = (
  reward: ExpReward,
): LevelExpPoint => {
  if (!OVERLEVEL_PROTECTION) {
    return {
      baseLvl: 0,
      jobLvl: 0,
    };
  }

  const overlevelMinBase = ((): number => {
    let level1Exp = 0;
    let level2Exp = 0;

    for (const [bLvl, baseExp] of Object.entries(baseExpChart)) {
      level1Exp = level2Exp;
      level2Exp = baseExp.expToNextLevel;

      const level2ExpCut = level2Exp * (OVERLEVEL_MAX_PERCENTAGE / 100);
      const totalExp = level1Exp + level2ExpCut;

      if (totalExp >= reward.base) {
        return +bLvl - 1;
      }
    }

    return Number.POSITIVE_INFINITY;
  })();

  const overlevelMinJob = ((): number => {
    let level1Exp = 0;
    let level2Exp = 0;

    for (const [jLvl, jobExp] of Object.entries(jobExpChart)) {
      level1Exp = level2Exp;
      level2Exp = jobExp.expToNextLevel;
      const level2ExpCut = level2Exp * (OVERLEVEL_MAX_PERCENTAGE / 100);
      const totalExp = level1Exp + level2ExpCut;

      if (totalExp >= reward.job) {
        return +jLvl - 1;
      }
    }

    return Number.POSITIVE_INFINITY;
  })();

  return {
    baseLvl: overlevelMinBase,
    jobLvl: overlevelMinJob,
  };
};
