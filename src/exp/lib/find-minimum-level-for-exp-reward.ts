import baseExpChart from '@/data/base-exp-chart.json' with { type: 'json' };
import jobExpChart from '@/data/job-exp-chart-first-class.json' with {
  type: 'json',
};
import { getLevelExpPoint, getRawExpPoint, maxBaseLevel, maxJobLevel, willOverlevel } from '@/exp/calc';
import { MIN_EXP_REWARD, OVERLEVEL_PROTECTION } from '@/exp/constants';
import type { LevelExpPoint, RawExpPoint } from '@/exp/types/exp-point';
import type { ExpReward } from '@/exp/types/exp-reward';
import { MonsterContext, MonsterThreshold } from '@/exp/types/monster-context';
import { getRewardsArray } from '@/exp/types/quest';
import { QuestId } from '@/exp/types/quest-id';

// TODO use kill numbers from minimum level search so it does not need to calculate kills after?
export const findMinimumLevelForExpReward = (
  reward: ExpReward | ReadonlyArray<ExpReward>,
  monsterContext: MonsterContext,
  completedQuests: ReadonlySet<QuestId>,
  startingExp?: RawExpPoint,
): [
  LevelExpPoint,
  { readonly reachedMaxBase: boolean; readonly reachedMaxJob: boolean },
] => {
  const rewards = getRewardsArray(reward);
  const allRewardsResult = _findMinimumLevelForExpReward(rewards);

  const relevantThresholds = monsterContext.thresholds.reduce((acc, threshold, _index, arr) => {
    const [, prereq] = threshold;
    if (prereq.quests.difference(completedQuests).size) {
      // TODO hack
      (arr as Array<MonsterThreshold>).splice(1);
    } else {
      acc.push(threshold)
    }

    return acc;
  }, [] as Array<MonsterThreshold>);

  const monsterThreshold = relevantThresholds.at(0)
  const _monster = monsterThreshold ? monsterContext.get(monsterThreshold[0]) : undefined

  if (!_monster || rewards.length === 1) {
    return allRewardsResult;
  }

  const monster = _monster;
  const [allRewardsExp] = allRewardsResult;

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

    // TODO use increments like these only with provided starting exp
    // if not provided then return the very highest minimum exp.. prob should use binary search or similar
    // and return separately, otherwise exp are gained together from a monster
    // always pool. but if provided exp the difference can be only multiply of thresholds added to starting exp??
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

    return [maxBaseLevel, false];
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

    return [maxJobLevel, false];
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
