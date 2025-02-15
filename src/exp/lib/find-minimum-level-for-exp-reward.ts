import baseExpChart from '@/data/base-exp-chart.json' with { type: 'json' };
import jobExpChart from '@/data/job-exp-chart-first-class.json' with {
  type: 'json',
};
import {
  type ExpReward,
  getLevelExpPoint,
  getRawExpPoint,
  willOverlevel,
} from '@/exp/calc';
import { OVERLEVEL_PROTECTION } from '@/exp/constants';
import type { Monster } from '@/exp/monsters';
import { getRewardsArray } from '@/exp/quests';
import type { LevelExpPoint, RawExpPoint } from '@/exp/types/exp-point';

export const findMinimumLevelForExpReward = (
  reward: ExpReward | ReadonlyArray<ExpReward>,
  getMonster?: (maxBaseLevel: number) => Monster,
  startingExp?: RawExpPoint,
): LevelExpPoint => {
  const rewards = getRewardsArray(reward);
  const allRewardsResult = _findMinimumLevelForExpReward(rewards);

  if (!getMonster || rewards.length === 1) {
    return allRewardsResult;
  }

  const monster = getMonster(allRewardsResult.baseLvl);
  const endExp = getRawExpPoint(allRewardsResult);

  const baseLvl = ((): number => {
    const startExp = ((): RawExpPoint => {
      if (startingExp) {
        return startingExp;
      }

      const firstBaseReward = rewards.find((reward) => reward.base > 0);

      const firstRewardResult = _findMinimumLevelForExpReward(
        firstBaseReward ? [firstBaseReward] : [],
      );

      return getRawExpPoint(firstRewardResult);
    })();

    expLoop: for (
      let baseExp = startExp.baseExp;
      baseExp <= endExp.baseExp;
      baseExp += monster.base
    ) {
      let currentBaseExp = baseExp;

      for (const reward of rewards) {
        if (
          willOverlevel({ baseExp: currentBaseExp, jobExp: 0 }, reward).base
        ) {
          continue expLoop;
        }

        currentBaseExp += reward.base;
      }

      return getLevelExpPoint({ baseExp, jobExp: 0 }).baseLvl;
    }

    return allRewardsResult.baseLvl;
  })();

  const jobLvl = ((): number => {
    const startExp = ((): RawExpPoint => {
      if (startingExp) {
        return startingExp;
      }

      const firstJobReward = rewards.find((reward) => reward.job > 0);

      const firstRewardResult = _findMinimumLevelForExpReward(
        firstJobReward ? [firstJobReward] : [],
      );

      return getRawExpPoint(firstRewardResult);
    })();

    expLoop: for (
      let jobExp = startExp.jobExp;
      jobExp <= endExp.jobExp;
      jobExp += monster.job
    ) {
      let currentJobExp = jobExp;

      for (const reward of rewards) {
        if (willOverlevel({ baseExp: 0, jobExp: currentJobExp }, reward).job) {
          continue expLoop;
        }

        currentJobExp += reward.job;
      }

      return getLevelExpPoint({ baseExp: 0, jobExp }).jobLvl;
    }

    return allRewardsResult.jobLvl;
  })();

  return {
    baseLvl,
    jobLvl,
  };
};

const _findMinimumLevelForExpReward = (
  rewards: ReadonlyArray<ExpReward>,
): LevelExpPoint => {
  if (!OVERLEVEL_PROTECTION) {
    return {
      baseLvl: 1,
      jobLvl: 1,
    };
  }

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
