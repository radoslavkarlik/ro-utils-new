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

export const maxBaseLevel =
  Number(Object.keys(baseExpChart).toReversed()[0]) || 1;
export const maxJobLevel =
  Number(Object.keys(jobExpChart).toReversed()[0]) || 1;

export const getExpBeforeExpReward = (
  journey: Journey,
  rewards: ReadonlyArray<ExpReward>,
): false | { readonly finishedExp: Exp } => {
  const { ignoreOverlevel, allowPercentWaste } =
    journey.context.overcapSettings;
  const relevantThresholds = journey.monster.getRelevantThresholds(
    journey.quests.completedQuests,
  );

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

    epxLoop: for (
      ;
      exp.raw.baseExp < targetExp;
      exp = addReward(exp, monster.reward), totalKills++
    ) {
      let totalExp = exp;

      rewardsLoop: for (const reward of rewards) {
        const cappedReward = capExpReward(totalExp, reward);
        totalExp = addReward(totalExp, cappedReward);

        switch (ignoreOverlevel) {
          case 'always':
            continue;

          case 'short-of-target':
            if (
              totalExp.level.baseLvl + 1 >= maxBaseLevel ||
              totalExp.level.jobLvl + 1 >= maxJobLevel
            ) {
              break rewardsLoop;
            }

            break;

          case 'full-target':
            if (
              totalExp.level.baseLvl >= maxBaseLevel ||
              totalExp.level.jobLvl >= maxJobLevel
            ) {
              break rewardsLoop;
            }

            break;
        }

        // TODO percent per single in batch or per total?
        const allowedMinReward: ExpReward = {
          base: Math.floor(reward.base * (1 - allowPercentWaste / 100)),
          job: Math.floor(reward.job * (1 - allowPercentWaste / 100)),
        };

        if (
          cappedReward.base < allowedMinReward.base ||
          cappedReward.job < allowedMinReward.job
        ) {
          continue epxLoop;
        }
      }

      finishedExp = totalExp;

      if (totalKills > 0) {
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
      }

      break thresholdLoop;
    }

    // TODO if it is here shouldnt it be fail?

    if (totalKills > 0) {
      // TODO how can this be 0 at this point?
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
    }
  }

  journey.addKills(killsJourney);
  journey.monster.catchUp(journey.exp, journey.quests.completedQuests);

  return { finishedExp };
};
