import type { ExpReward } from '@/exp/types/exp-reward';
import type { Journey } from '@/exp/types/journey';
import jobExpChart from '@/data/job-exp-chart-first-class.json' with {
  type: 'json',
};
import baseExpChart from '@/data/base-exp-chart.json' with { type: 'json' };
import { capExpReward, getBaseExp } from '@/exp/calc';
import { addReward } from '@/exp/lib/add-reward';
import type { KillsJourney } from '@/exp/lib/get-kills-journey';
import { produce } from 'immer';
import type { Exp } from '@/exp/types/exp';
import { getRewardsArray, type ExpQuest } from '@/exp/types/quest';

export const maxBaseLevel =
  Number(Object.keys(baseExpChart).toReversed()[0]) || 1;
export const maxJobLevel =
  Number(Object.keys(jobExpChart).toReversed()[0]) || 1;

export const getExpBeforeExpReward = (
  journey: Journey,
  quest: ExpQuest,
): Exp => {
  const rewards = getRewardsArray(quest.reward);
  const { allowPercentWasteQuests, ignoreWaste } =
    journey.context.overcapSettings;
  const relevantThresholds = journey.monster.getRelevantThresholds(
    journey.quests.completedQuests,
  );

  const allowPercentWaste = allowPercentWasteQuests.get(quest.id) ?? 0;

  let exp = journey.exp;
  let finishedExp = journey.exp;
  let killsJourney: KillsJourney = {
    steps: [],
    totalKills: 0,
  };

  thresholdLoop: for (const threshold of relevantThresholds) {
    const targetExp = getBaseExp(threshold.next?.baseLevel ?? maxBaseLevel);
    const { monster } = threshold.current;

    let totalKills = 0;

    const markStep = (): void => {
      if (totalKills <= 0) {
        return;
      }

      killsJourney = produce(killsJourney, (killsJourney) => {
        killsJourney.steps.push({
          type: 'monster',
          exp,
          monsterId: monster.id,
          monsterName: monster.name,
          kills: totalKills,
        });

        killsJourney.totalKills += totalKills;
      });
    };

    expLoop: for (
      ;
      exp.raw.baseExp < targetExp;
      exp = addReward(exp, monster.reward), totalKills++
    ) {
      let totalExp = exp;

      rewardsLoop: for (const reward of rewards) {
        const cappedReward = capExpReward(totalExp, reward);
        totalExp = addReward(totalExp, cappedReward);

        const allowedMinReward: ExpReward = {
          base: Math.floor(reward.base * (1 - allowPercentWaste / 100)),
          job: Math.floor(reward.job * (1 - allowPercentWaste / 100)),
        };

        const hasWaste =
          cappedReward.base < allowedMinReward.base ||
          cappedReward.job < allowedMinReward.job;

        if (!hasWaste) {
          continue;
        }

        switch (ignoreWaste) {
          case 'always':
            continue rewardsLoop;

          case 'short-of-target':
            if (
              totalExp.level.baseLvl + 1 >= maxBaseLevel ||
              totalExp.level.jobLvl + 1 >= maxJobLevel
            ) {
              break expLoop;
            }

            continue expLoop;

          case 'full-target':
            if (
              totalExp.level.baseLvl >= maxBaseLevel ||
              totalExp.level.jobLvl >= maxJobLevel
            ) {
              break expLoop;
            }

            continue expLoop;

          default:
            continue expLoop;
        }
      }

      finishedExp = totalExp;
      markStep();
      break thresholdLoop;
    }

    markStep();
  }

  journey.addKills(killsJourney);
  journey.monster.catchUp(journey.exp, journey.quests.completedQuests);

  return finishedExp;
};
