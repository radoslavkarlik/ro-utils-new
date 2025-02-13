import {
  type ExpReward,
  calcMonsterCount,
  getLevelExpPoint,
  getRawExpPoint,
  willOverlevel,
} from '@/exp/calc';
import {
  EXP_QUEST_RATE,
  OVERLEVEL_MAX_PERCENTAGE,
  OVERLEVEL_PROTECTION,
} from '@/exp/constants';
import { findMinimumLevelForExpReward } from '@/exp/lib/find-minimum-level-for-exp-reward';
import { type Monster, MonsterId, monsters } from '@/exp/monsters';
import {
  type AdjustedQuest,
  type ExpQuest,
  type ExpQuestWithMinLevel,
  type MonsterQuest,
  QuestId,
  isExpQuest,
  isExpQuestWithMinLevel,
  quests,
} from '@/exp/quests';
import type { Quest } from '@/exp/quests';
import type {
  ExpJourney,
  ExpJourneyMonsterStep,
  ExpJourneyStep,
} from '@/exp/types/exp-journey';
import {
  type ExpPoint,
  type LevelExpPoint,
  type RawExpPoint,
  isRawExpPoint,
} from '@/exp/types/exp-point';
import { numericallyAsc, sortByProp } from '@/lib/sort-by';

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
  const adjustedQuests = Object.fromEntries(
    Object.entries(quests).map(([questId, quest]) => {
      if (!isExpQuest(quest)) {
        return [questId as QuestId, quest] as const;
      }

      const questBaseExp = Math.floor(quest.base * EXP_QUEST_RATE);
      const questJobExp = Math.floor(quest.job * EXP_QUEST_RATE);
      const { baseLvl, jobLvl } = findMinimumLevelForExpReward({
        base: questBaseExp,
        job: questJobExp,
      });

      return [
        questId as QuestId,
        {
          ...quest,
          base: questBaseExp,
          job: questJobExp,
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

  const buildFollowUpChain = (quest: Quest): ReadonlyArray<Quest> =>
    quest.followUpQuest
      ? [quest, ...buildFollowUpChain(quests[quest.followUpQuest])]
      : [quest];

  const getAdjustedMinQuestLevel = (
    quest: ExpQuestWithMinLevel,
  ): LevelExpPoint => {
    return new Set(
      buildPrereqChain(quest)
        .concat(buildFollowUpChain(quest))
        .map((quest) => quest.id),
    )
      .values()
      .toArray()
      .reduce<LevelExpPoint>(
        (minLevels, id) => {
          const associateQuest = adjustedQuests[id];

          const minLevel = ((): LevelExpPoint => {
            if (isExpQuestWithMinLevel(associateQuest)) {
              return {
                baseLvl: Math.max(
                  associateQuest.minRewardBaseLevel,
                  associateQuest.prerequisite?.baseLevel ?? 0,
                ),
                jobLvl: associateQuest.minRewardJobLevel,
              };
            }

            const monster = monsters[associateQuest.kills.monsterId];

            return { baseLvl: monster.prerequisite?.baseLevel ?? 0, jobLvl: 0 };
          })();

          return {
            baseLvl: Math.max(minLevels.baseLvl, minLevel.baseLvl),
            jobLvl: Math.max(minLevels.jobLvl, minLevel.jobLvl),
          };
        },
        { baseLvl: 0, jobLvl: 0 },
      );
  };

  let questsToDo = unfinishedQuestIds
    .values()
    .map((questId) => {
      const quest = adjustedQuests[questId];

      if (isExpQuestWithMinLevel(quest)) {
        const { baseLvl, jobLvl } = getAdjustedMinQuestLevel(quest);

        return {
          id: questId,
          baseExp: quest.base,
          jobExp: quest.job,
          minBaseLvl: baseLvl,
          minJobLvl: jobLvl,
          questPrerequisites: quest.prerequisite?.questIds,
        } as const;
      }

      const monster = monsters[quest.kills.monsterId];

      return {
        id: questId,
        minBaseLvl: monster.prerequisite?.baseLevel ?? 0,
        baseExp: 0,
        jobExp: 0,
        minJobLvl: 0,
        monsterPrerequisites: quest.kills,
      } as const;
    })
    .toArray();

  const monsterBaseLvlThresholds = allowedMonsters
    .map((monsterId) => monsters[monsterId])
    .sort(
      sortByProp({
        select: (monster) => monster.prerequisite?.baseLevel ?? 0,
        compare: numericallyAsc,
      }),
    )
    .map(
      (monster) => [monster.id, monster.prerequisite?.baseLevel ?? 0] as const,
    );

  let expRaw = isRawExpPoint(start) ? start : getRawExpPoint(start);
  let expLevel = isRawExpPoint(start) ? getLevelExpPoint(start) : start;

  const applyExp = (exp: RawExpPoint): void => {
    expRaw = {
      baseExp: expRaw.baseExp + exp.baseExp,
      jobExp: expRaw.jobExp + exp.jobExp,
    };

    expLevel = getLevelExpPoint(expRaw);
  };

  const targetRaw = isRawExpPoint(target) ? target : getRawExpPoint(target);

  let monsterIndex = 0;
  let [monsterId] = monsterBaseLvlThresholds[monsterIndex]!;

  let steps: ReadonlyArray<ExpJourneyStep> = [];

  const killMonsters = (target: ExpPoint) => {
    const [count, newExpPoint] = calcMonsterCount(expRaw, target, monsterId);

    applyExp({
      baseExp: newExpPoint.baseExp,
      jobExp: newExpPoint.jobExp,
    });

    steps = [...steps, { monsterId, count, expPoint: expLevel }];
  };

  const getExpFromMonsters = (target: ExpPoint): void => {
    if (monsterBaseLvlThresholds.length - 1 > monsterIndex) {
      const [, nextMonsterThreshold] =
        monsterBaseLvlThresholds[monsterIndex + 1]!;

      if (nextMonsterThreshold <= expLevel.baseLvl) {
        monsterIndex++;
        [monsterId] = monsterBaseLvlThresholds[monsterIndex]!;
        getExpFromMonsters(target);
        return;
      }

      const targetLevel = isRawExpPoint(target)
        ? getLevelExpPoint(target)
        : target;

      if (nextMonsterThreshold <= targetLevel.baseLvl) {
        killMonsters({ baseLvl: nextMonsterThreshold, jobLvl: 0 });

        monsterIndex++;
        [monsterId] = monsterBaseLvlThresholds[monsterIndex]!;
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

    if (quest.monsterPrerequisites) {
      const { monsterId, count } = quest.monsterPrerequisites;
      const monster = monsters[monsterId];

      applyExp({
        baseExp: monster.base * count,
        jobExp: monster.job * count,
      });
    } else {
      do {
        const { base: overleveledBase, job: overleveledJob } = willOverlevel(
          expRaw,
          { base: quest.baseExp, job: quest.jobExp },
        );

        if (!overleveledBase && !overleveledJob) {
          break;
        }

        const targetLevel: LevelExpPoint = {
          baseLvl: overleveledBase ? Math.floor(expLevel.baseLvl) + 1 : 0,
          jobLvl: overleveledJob ? Math.floor(expLevel.jobLvl) + 1 : 0,
        };

        getExpFromMonsters(targetLevel);
      } while (true);

      applyExp({
        baseExp: quest.baseExp,
        jobExp: quest.jobExp,
      });
    }

    questsToDo = questsToDo.filter((questToDo) => questToDo.id !== quest.id);
    steps = [...steps, { questId: quest.id, expPoint: expLevel }];
  };

  const getQuestToDo = () => {
    if (!questsToDo.length) {
      return null;
    }

    return questsToDo.toSorted((quest1, quest2) => {
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

      if (quest1.jobExp && !quest2.jobExp) {
        return 1;
      }

      if (!quest1.jobExp && quest2.jobExp) {
        return -1;
      }

      if (!quest1.jobExp && !quest2.jobExp) {
        const minBase = Math.sign(quest1.minBaseLvl - quest2.minBaseLvl);

        if (minBase) {
          return minBase;
        }

        const baseExp = Math.sign(quest1.baseExp - quest2.baseExp);

        if (baseExp) {
          return baseExp;
        }
      }

      const minJob = Math.sign(quest1.minJobLvl - quest2.minJobLvl);

      if (minJob) {
        return minJob;
      }

      return Math.sign(quest1.jobExp - quest2.jobExp);
    })[0];
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

const steps = getExpJourney({
  start: { baseLvl: 11, jobLvl: 0 },
  target: { jobLvl: 50, baseLvl: 0 },
  allowedQuests: Object.values(QuestId),
  finishedQuests: [],
  allowedMonsters: [
    MonsterId.Spore,
    MonsterId.Metaling,
    MonsterId.Muka,
    MonsterId.Wolf,
  ],
});

console.log(steps);
