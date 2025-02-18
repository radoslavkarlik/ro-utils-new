import {
  type ExpReward,
  calcMonsterCount,
  capExpReward,
  getLevelExpPoint,
  getMonsterBaseLvlThresholds,
  getRawExpPoint,
  willOverlevel,
} from '@/exp/calc';
import {
  EXP_QUEST_RATE,
  MIN_EXP_REWARD,
  OVERLEVEL_PROTECTION,
} from '@/exp/constants';
import { findMinimumLevelForExpReward } from '@/exp/lib/find-minimum-level-for-exp-reward';
import { monsters } from '@/exp/monsters';
import type { Monster } from '@/exp/monsters';
import {
  type AdjustedQuest,
  type ExpQuestWithMinLevel,
  getRewardsArray,
  getTotalExpReward,
  isExpQuest,
  isExpQuestWithMinLevel,
  quests,
} from '@/exp/quests';
import type { Quest } from '@/exp/quests';
import {
  type ExpJourneQuestStep,
  type ExpJourney,
  type ExpJourneyMonsterStep,
  type ExpJourneyStep,
  isMonsterExpJourneyStep,
} from '@/exp/types/exp-journey';
import {
  type ExpPoint,
  type LevelExpPoint,
  isRawExpPoint,
} from '@/exp/types/exp-point';
import type { MonsterId } from '@/exp/types/monster-id';
import type { QuestId } from '@/exp/types/quest-id';

type Args = {
  readonly start: ExpPoint;
  readonly target: ExpPoint;
  readonly allowedQuests: ReadonlyArray<QuestId>;
  readonly finishedQuests: ReadonlyArray<QuestId>;
  readonly allowedMonsters: ReadonlyArray<MonsterId>;
};

export const getExpJourney = ({
  start,
  target,
  allowedMonsters,
  finishedQuests,
  allowedQuests,
}: Args): ExpJourney => {
  const monsterBaseLvlThresholds = getMonsterBaseLvlThresholds(allowedMonsters);

  const adjustedQuests = Object.fromEntries(
    Object.entries(quests).map(([questId, quest]) => {
      if (!isExpQuest(quest)) {
        return [questId as QuestId, quest] as const;
      }

      const rewards = getRewardsArray(quest.reward);

      const rewardsWithRate = rewards.map<ExpReward>((reward) => ({
        base: Math.floor(reward.base * EXP_QUEST_RATE),
        job: Math.floor(reward.job * EXP_QUEST_RATE),
      }));

      const getMonster = (maxBaseLevel: number): Monster => {
        const [monsterId] = monsterBaseLvlThresholds
          .toReversed()
          .find(([, baseLevel]) => baseLevel < maxBaseLevel)!;

        return monsters[monsterId];
      };

      const { baseLvl, jobLvl } = findMinimumLevelForExpReward(
        rewardsWithRate,
        getMonster,
      );

      return [
        questId as QuestId,
        {
          ...quest,
          reward:
            rewardsWithRate.length === 1
              ? rewardsWithRate[0]!
              : rewardsWithRate,
          minRewardBaseLevel: baseLvl,
          minRewardJobLevel: jobLvl,
        } satisfies ExpQuestWithMinLevel,
      ] as const;
    }),
  ) as Record<QuestId, AdjustedQuest>;

  const unfinishedQuestIds = new Set(allowedQuests).difference(
    new Set(finishedQuests),
  );

  const buildPrereqChain = (quest: Quest): ReadonlyArray<Quest> =>
    isExpQuest(quest) && quest.prerequisite?.questIds
      ? [
          quest,
          ...quest.prerequisite.questIds.flatMap((questId) =>
            buildPrereqChain(quests[questId]),
          ),
        ]
      : [quest];

  const getAdjustedMinQuestLevel = (
    quest: ExpQuestWithMinLevel,
  ): LevelExpPoint => {
    return new Set(buildPrereqChain(quest))
      .values()
      .toArray()
      .reduce<LevelExpPoint>(
        (minLevels, quest) => {
          const associateQuest = adjustedQuests[quest.id];

          const minLevel = ((): LevelExpPoint => {
            if (isExpQuestWithMinLevel(associateQuest)) {
              return {
                baseLvl: Math.max(
                  associateQuest.minRewardBaseLevel,
                  associateQuest.prerequisite?.baseLevel ?? 1,
                ),
                jobLvl: Math.max(
                  associateQuest.minRewardJobLevel,
                  associateQuest.prerequisite?.jobLevel ?? 1,
                ),
              };
            }

            const monster = monsters[associateQuest.kills.monsterId];

            return { baseLvl: monster.prerequisite?.baseLevel ?? 1, jobLvl: 1 };
          })();

          return {
            baseLvl: Math.max(minLevels.baseLvl, minLevel.baseLvl),
            jobLvl: Math.max(minLevels.jobLvl, minLevel.jobLvl),
          };
        },
        { baseLvl: 1, jobLvl: 1 },
      );
  };

  let questsToDo = unfinishedQuestIds
    .values()
    .map((questId) => {
      const quest = adjustedQuests[questId];

      if (isExpQuestWithMinLevel(quest)) {
        const { baseLvl, jobLvl } = getAdjustedMinQuestLevel(quest);
        const rewards = getRewardsArray(quest.reward);

        return {
          id: questId,
          rewards,
          totalReward: getTotalExpReward(rewards),
          minBaseLvl: baseLvl,
          minJobLvl: jobLvl,
          questPrerequisites: quest.prerequisite?.questIds,
        } as const;
      }

      const monster = monsters[quest.kills.monsterId];

      return {
        id: questId,
        totalReward: { base: 0, job: 0 } satisfies ExpReward,
        minBaseLvl: monster.prerequisite?.baseLevel ?? 1,
        minJobLvl: 1,
        monsterPrerequisites: quest.kills,
      } as const;
    })
    .toArray();

  let expRaw = isRawExpPoint(start) ? start : getRawExpPoint(start);
  let expLevel = isRawExpPoint(start) ? getLevelExpPoint(start) : start;

  const applyExp = (reward: ExpReward, ignoreOverLevel?: boolean): void => {
    // TODO optimize, calculation is done in willOverflow already for quests, so it can return how much to add max if we decided to allow lost exp due to max level anyway

    if (!OVERLEVEL_PROTECTION || !ignoreOverLevel) {
      expRaw = {
        baseExp: expRaw.baseExp + reward.base,
        jobExp: expRaw.jobExp + reward.job,
      };
    } else {
      const { base: capRewardBase, job: capRewardJob } = capExpReward(
        expRaw,
        expLevel,
        reward,
      );

      expRaw = {
        baseExp: expRaw.baseExp + capRewardBase,
        jobExp: expRaw.jobExp + capRewardJob,
      };
    }

    expLevel = getLevelExpPoint(expRaw);
  };

  const targetRaw = isRawExpPoint(target) ? target : getRawExpPoint(target);

  let monsterIndex = 0;
  let [monsterId] = monsterBaseLvlThresholds[monsterIndex]!;

  const steps: Array<ExpJourneyStep> = [];

  const addMonsterStep = (step: ExpJourneyMonsterStep): void => {
    const lastStep = steps[steps.length - 1];

    if (
      lastStep &&
      isMonsterExpJourneyStep(lastStep) &&
      lastStep.monsterId === step.monsterId
    ) {
      steps.pop();
      steps.push({
        ...step,
        count: lastStep.count + step.count,
      });
    } else {
      steps.push(step);
    }
  };

  const addQuestStep = (step: ExpJourneQuestStep): void => {
    steps.push(step);
  };

  const killMonsters = (target: ExpPoint) => {
    const [count, newExpPoint] = calcMonsterCount(expRaw, target, monsterId);

    applyExp({
      base: newExpPoint.baseExp,
      job: newExpPoint.jobExp,
    });

    addMonsterStep({ monsterId, count, expPoint: expLevel });
  };

  const getExpFromMonsters = (target: ExpPoint): void => {
    if (monsterBaseLvlThresholds.length - 1 > monsterIndex) {
      const [nextMonsterId, nextMonsterThreshold] =
        monsterBaseLvlThresholds[monsterIndex + 1]!;

      const nextMonster = monsters[nextMonsterId];
      const nextMonsterQuestId = nextMonster.prerequisite?.questId;

      if (
        nextMonsterQuestId &&
        allowedQuests.includes(nextMonsterQuestId) &&
        questsToDo.find((questToDo) => questToDo.id === nextMonsterQuestId)
      ) {
        // did not complete the quest
        killMonsters(target);
        return;
      }

      if (nextMonsterThreshold <= expLevel.baseLvl) {
        monsterIndex++;
        [monsterId] = monsterBaseLvlThresholds[monsterIndex]!;

        getExpFromMonsters(target);
        return;
      }

      const targetLevel = isRawExpPoint(target)
        ? getLevelExpPoint(target)
        : target;

      if (nextMonsterThreshold < targetLevel.baseLvl) {
        killMonsters({ baseLvl: nextMonsterThreshold, jobLvl: 1 });

        monsterIndex++;
        [monsterId] = monsterBaseLvlThresholds[monsterIndex]!;
      } else if (nextMonsterThreshold === targetLevel.baseLvl) {
        killMonsters({ baseLvl: nextMonsterThreshold, jobLvl: 1 });

        monsterIndex++;
        [monsterId] = monsterBaseLvlThresholds[monsterIndex]!;

        return;
      }
    }

    killMonsters(target);
  };

  const meetsLevelRequirements = (target: ExpPoint): boolean => {
    const targetRaw = isRawExpPoint(target) ? target : getRawExpPoint(target);

    return (
      expRaw.baseExp >= targetRaw.baseExp && expRaw.jobExp >= targetRaw.jobExp
    );
  };

  const performQuest = (quest: (typeof questsToDo)[number]): void => {
    const questMinLevel: ExpPoint = {
      baseLvl: quest.minBaseLvl,
      jobLvl: quest.minJobLvl,
    };

    if (!meetsLevelRequirements(questMinLevel)) {
      getExpFromMonsters(questMinLevel);
    }

    // TODO refactor lol
    let ignoreOverLevel = false;

    if (quest.monsterPrerequisites) {
      const { monsterId, count } = quest.monsterPrerequisites;
      const monster = monsters[monsterId];

      applyExp({
        base: monster.base * count,
        job: monster.job * count,
      });
    } else {
      if (quest.rewards.length === 1) {
        const {
          base: overleveledBase,
          job: overleveledJob,
          ignoreOverLevel: _ignoreOverLevel,
        } = willOverlevel(expRaw, {
          base: quest.totalReward.base,
          job: quest.totalReward.job,
        });

        ignoreOverLevel = _ignoreOverLevel;

        if (overleveledBase || overleveledJob) {
          const targetLevel: LevelExpPoint = {
            baseLvl: overleveledBase ? Math.floor(expLevel.baseLvl) + 1 : 1,
            jobLvl: overleveledJob ? Math.floor(expLevel.jobLvl) + 1 : 1,
          };

          getExpFromMonsters(targetLevel);
        }
      } else {
        // check if it is not going to overlevel after all
        // TODO can this result unnecessary level up due to overlevel at max job level?
        const targetLevel = findMinimumLevelForExpReward(
          quest.rewards,
          () => monsters[monsterId],
          expRaw,
        );

        if (
          targetLevel.baseLvl > expLevel.baseLvl ||
          targetLevel.jobLvl > expLevel.jobLvl
        ) {
          getExpFromMonsters(targetLevel);
        }
      }
    }

    applyExp(
      {
        base: quest.totalReward.base,
        job: quest.totalReward.job,
      },
      ignoreOverLevel,
    );

    questsToDo = questsToDo.filter((questToDo) => questToDo.id !== quest.id);
    addQuestStep({ questId: quest.id, expPoint: expLevel });
  };

  const getQuestToDo = () => {
    if (!questsToDo.length) {
      return null;
    }

    const sortedQuestsToDoFromCurrentExp = questsToDo.toSorted(
      (quest1, quest2) => {
        if (quest1.questPrerequisites?.includes(quest2.id)) {
          return 1;
        }

        if (quest2.questPrerequisites?.includes(quest1.id)) {
          return -1;
        }

        const req1: LevelExpPoint = {
          baseLvl: quest1.minBaseLvl,
          jobLvl: quest1.minJobLvl,
        };

        const req2: LevelExpPoint = {
          baseLvl: quest2.minBaseLvl,
          jobLvl: quest2.minJobLvl,
        };

        const meets1 = meetsLevelRequirements(req1);
        const meets2 = meetsLevelRequirements(req2);

        if (meets1 && !meets2) {
          return -1;
        }

        if (meets2 && !meets1) {
          return 1;
        }

        if (!meets1 && !meets2) {
          const [count1] = calcMonsterCount(expRaw, req1, monsterId);
          const [count2] = calcMonsterCount(expRaw, req2, monsterId);

          return count1 - count2;
        }

        if (
          quest1.totalReward.job > MIN_EXP_REWARD &&
          quest2.totalReward.job <= MIN_EXP_REWARD
        ) {
          return 1;
        }

        if (
          quest1.totalReward.job <= MIN_EXP_REWARD &&
          quest2.totalReward.job > MIN_EXP_REWARD
        ) {
          return -1;
        }

        if (
          quest1.totalReward.job <= MIN_EXP_REWARD &&
          quest2.totalReward.job <= MIN_EXP_REWARD
        ) {
          const minBase = Math.sign(quest1.minBaseLvl - quest2.minBaseLvl);

          if (minBase) {
            return minBase;
          }

          const baseExp = Math.sign(
            quest1.totalReward.base - quest2.totalReward.base,
          );

          if (baseExp) {
            return baseExp;
          }
        }

        const minJob = Math.sign(quest1.minJobLvl - quest2.minJobLvl);

        if (minJob) {
          return minJob;
        }

        return Math.sign(quest1.totalReward.job - quest2.totalReward.job);
      },
    );

    return sortedQuestsToDoFromCurrentExp[0];
  };

  while (!meetsLevelRequirements(targetRaw)) {
    const questToDo = getQuestToDo();

    if (questToDo) {
      performQuest(questToDo);
    } else {
      getExpFromMonsters(targetRaw);
    }
  }

  return steps;
};
