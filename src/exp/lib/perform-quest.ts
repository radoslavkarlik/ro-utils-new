import { applyRates, meetsExpRequirements } from '@/exp/calc';
import { addReward } from '@/exp/lib/add-reward';
import { getExpBeforeExpReward } from '@/exp/lib/get-exp-before-exp-reward';
import { getKillsJourney } from '@/exp/lib/get-kills-journey';
import { Exp, type Journey } from '@/exp/types/journey';
import { getRewardsArray, isExpQuest } from '@/exp/types/quest';
import type { QuestId } from '@/exp/types/quest-id';

export const performQuest = (
  journey: Journey,
  getBestJourneyKills: () => number,
  questId: QuestId,
): Journey | null => {
  const bestJourneyKills = getBestJourneyKills();
  const newJourney = journey.split();

  const quest = newJourney.context.quests.get(questId);

  const minReqExp = ((): Exp => {
    if (isExpQuest(quest)) {
      return new Exp({
        baseLvl: quest.prerequisite?.baseLevel ?? 1,
        jobLvl: quest.prerequisite?.jobLevel ?? 1,
      });
    }

    const monster = newJourney.context.monsters.get(quest.kills.monsterId);

    return new Exp({
      baseLvl: monster.prerequisite?.baseLevel ?? 1,
      jobLvl: 1,
    });
  })();

  if (!meetsExpRequirements(newJourney.exp, minReqExp)) {
    const killsJourney = getKillsJourney({
      startExp: newJourney.exp,
      targetExp: minReqExp,
      currentMonster: newJourney.monster,
      completedQuests: newJourney.quests.completedQuests,
    });

    newJourney.addKills(killsJourney);

    if (newJourney.totalKills >= bestJourneyKills) {
      return null;
    }
  }

  if (!isExpQuest(quest)) {
    const monster = newJourney.context.monsters.get(quest.kills.monsterId);
    const extraKills = quest.kills.count;
    const reward = applyRates(monster.reward, extraKills);
    const finishedExp = addReward(newJourney.exp, reward);

    newJourney.addKills({
      totalKills: extraKills,
      steps: [
        {
          type: 'quest-monster',
          kills: extraKills,
          monsterId: quest.kills.monsterId,
          monsterName: monster.name,
          exp: finishedExp,
          questId,
        },
      ],
    });

    if (newJourney.totalKills >= bestJourneyKills) {
      return null;
    }
  } else {
    const expRewardSuccess = getExpBeforeExpReward(
      newJourney,
      getRewardsArray(quest.reward),
    );

    if (!expRewardSuccess) {
      return null;
    }

    newJourney.addExp({
      type: 'quest',
      exp: expRewardSuccess.finishedExp,
      questId,
    });

    if (newJourney.totalKills >= bestJourneyKills) {
      return null;
    }
  }

  newJourney.completeQuest(quest);
  newJourney.monster.catchUp(newJourney.exp, newJourney.quests.completedQuests);

  return newJourney;
};
