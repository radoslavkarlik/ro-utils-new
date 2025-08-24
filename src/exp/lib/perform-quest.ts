import {
  applyRates,
  getLevelExpPoint,
  getMaxLevelExpPoint,
  getRawExpPoint,
  meetsExpRequirements,
} from '@/exp/calc';
import { addReward } from '@/exp/lib/add-reward';
import { findMinimumLevelForExpReward } from '@/exp/lib/find-minimum-level-for-exp-reward';
import { getKillsJourney } from '@/exp/lib/get-kills-journey';
import { mergeJourneys } from '@/exp/lib/merge-journeys';
import type { ExpJourney } from '@/exp/types/exp-journey';
import type { RawExpPoint } from '@/exp/types/exp-point';
import {
  getRewardsArray,
  getTotalExpReward,
  isExpQuest,
} from '@/exp/types/quest';
import type { QuestId } from '@/exp/types/quest-id';
import type { CurrentMonster, QueueStep } from '@/exp/types/queue-step';

export const performQuest =
  (previousStep: QueueStep) =>
  (questId: QuestId): QueueStep => {
    const quest = previousStep.context.quests.get(questId);

    // TODO prereq for exp and monster quest
    // TODO cap reward if resulted in overlevel.. e.g. just reached max level but there was overflow

    const minReqExp = ((): RawExpPoint => {
      if (isExpQuest(quest)) {
        const [minimumOverlevel] = findMinimumLevelForExpReward(
          quest.reward,
          // TODO optimize finding this or calculation
          () => previousStep.monster.monster,
        );

        const minQuestLvl = getMaxLevelExpPoint(minimumOverlevel, {
          baseLvl: quest.prerequisite?.baseLevel ?? 1,
          jobLvl: quest.prerequisite?.jobLevel ?? 1,
        });

        return getRawExpPoint(minQuestLvl);
      }

      const monster = previousStep.context.monsters.get(quest.kills.monsterId);

      return getRawExpPoint({
        baseLvl: monster.prerequisite?.baseLevel ?? 1,
        jobLvl: 1,
      });
    })();

    let extraKills = 0;
    let extraJourney: ExpJourney | null = null;
    let currentMonster: CurrentMonster | null = null;

    if (!meetsExpRequirements(previousStep.exp, minReqExp)) {
      [extraJourney, extraKills, currentMonster] = getKillsJourney({
        startExp: previousStep.exp,
        targetExp: minReqExp,
        previousQueueStep: previousStep,
      });
    }

    const journeyBeforeQuest = extraJourney
      ? mergeJourneys(previousStep.journey, extraJourney)
      : previousStep.journey;

    const newLevel = extraJourney?.[extraJourney.length - 1]?.expPoint;
    const newExp = newLevel ? getRawExpPoint(newLevel) : previousStep.exp;

    const newAvailableQuests = new Set(
          previousStep.availableQuests
            .values()
            .filter((available) => available !== questId),
        );

        const newCompletedQuests = new Set(previousStep.completedQuests).add(questId);

    if (isExpQuest(quest)) {
      const rewardsArray = getRewardsArray(quest.reward);
      const totalQuestReward = getTotalExpReward(rewardsArray);
      const finishedExp = addReward(newExp, totalQuestReward);

      const step: QueueStep = {
        ...previousStep,
        availableQuests: newAvailableQuests,
        completedQuests: newCompletedQuests,
        exp: finishedExp,
        kills: previousStep.kills + extraKills,
        monster: currentMonster ?? previousStep.monster,
        journey: [
          ...journeyBeforeQuest,
          {
            type: 'quest',
            expPoint: getLevelExpPoint(finishedExp),
            questId,
          },
        ],
      };

      return step;
    }

    const monster = previousStep.context.monsters.get(quest.kills.monsterId);

    const reward = applyRates(monster.reward, quest.kills.count);
    const finishedExp = addReward(newExp, reward);

    return {
      ...previousStep,
      availableQuests: newAvailableQuests,
      completedQuests: newCompletedQuests,
      exp: finishedExp,
      kills: previousStep.kills + extraKills + quest.kills.count,
      monster: currentMonster ?? previousStep.monster,
      journey: [
        ...journeyBeforeQuest,
        {
          type: 'quest',
          expPoint: getLevelExpPoint(finishedExp),
          questId,
        },
      ],
    };
  };
