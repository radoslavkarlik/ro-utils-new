import {
  applyRates,
  getLevelExpPoint,
  getMinLevelExpPoint,
  getRawExpPoint,
  meetsExpRequirements,
} from '@/exp/calc';
import { addReward } from '@/exp/lib/add-reward';
import { findMinimumLevelForExpReward } from '@/exp/lib/find-minimum-level-for-exp-reward';
import { getKillsJourney } from '@/exp/lib/get-kills-journey';
import { mergeJourneys } from '@/exp/lib/merge-journeys';
import type { ExpJourney, ExpJourneyQuestStep } from '@/exp/types/exp-journey';
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

        const minQuestLvl = getMinLevelExpPoint(minimumOverlevel, {
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

    if (isExpQuest(quest)) {
      const rewardsArray = getRewardsArray(quest.reward);
      const totalQuestReward = getTotalExpReward(rewardsArray);
      const finishedExp = addReward(newExp, totalQuestReward);

      const step: QueueStep = {
        ...previousStep,
        availableQuests: new Set(
          previousStep.availableQuests
            .values()
            .filter((available) => available !== questId),
        ),
        completedQuests: new Set(previousStep.completedQuests).add(questId),
        exp: finishedExp,
        kills: previousStep.kills + extraKills,
        monster: currentMonster ?? previousStep.monster,
        journey: [
          ...journeyBeforeQuest,
          {
            expPoint: getLevelExpPoint(finishedExp),
            questId,
          } satisfies ExpJourneyQuestStep,
        ],
      };

      return step;
    }

    const monster = previousStep.context.monsters.get(quest.kills.monsterId);

    const reward = applyRates(monster.reward, quest.kills.count);
    const newExp2 = addReward(newExp, reward);

    return {
      ...previousStep,
      availableQuests: new Set(
        previousStep.availableQuests
          .values()
          .filter((available) => available !== questId),
      ),
      completedQuests: new Set(previousStep.completedQuests).add(questId),
      exp: newExp2,
      kills: previousStep.kills + extraKills + quest.kills.count,
      monster: previousStep.monster,
      journey: [
        ...journeyBeforeQuest,
        {
          expPoint: getLevelExpPoint(newExp2),
          questId,
        } satisfies ExpJourneyQuestStep,
      ],
    };
  };
