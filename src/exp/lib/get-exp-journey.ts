import baseExpChart from '@/data/base-exp-chart.json' with { type: 'json' };
import jobExpChart from '@/data/job-exp-chart-first-class.json' with {
  type: 'json',
};
import {
  type ExpReward,
  applyRates,
  calcMonsterCount,
  capExpRewardBase,
  capExpRewardJob,
  getLevelExpPoint,
  getMonsterBaseLvlThresholds,
  getRawExpPoint,
} from '@/exp/calc';
import {
  EXP_QUEST_RATE,
  MONSTER_RATE,
  OVERLEVEL_PROTECTION,
} from '@/exp/constants';
import { findMinimumLevelForExpReward } from '@/exp/lib/find-minimum-level-for-exp-reward';
import { type Monster, monsters as monstersBeforeRates } from '@/exp/monsters';
import {
  type Quest,
  getRewardsArray,
  getTotalExpReward,
  isExpQuest,
  quests as questsBeforeRates,
} from '@/exp/quests';
import {
  type ExpJourneQuestStep,
  type ExpJourney,
  type ExpJourneyMonsterStep,
  type ExpJourneyStep,
  isMonsterExpJourneyStep,
} from '@/exp/types/exp-journey';
import {
  type ExpPoint,
  type RawExpPoint,
  isRawExpPoint,
} from '@/exp/types/exp-point';
import { MonsterId } from '@/exp/types/monster-id';
import { QuestId } from '@/exp/types/quest-id';
import { isArray } from '@/lib/is-array';
import { PriorityQueue } from '@/lib/priority-queue';

const maxBaseLevel = Number(Object.keys(baseExpChart).toReversed()[0]) || 1;
const maxJobLevel = Number(Object.keys(jobExpChart).toReversed()[0]) || 1;

type Args = {
  readonly start: ExpPoint;
  readonly target: ExpPoint;
  readonly allowedQuests: ReadonlyArray<QuestId>;
  readonly allowedMonsters: ReadonlyArray<MonsterId>;
};

export function* getExpJourney({
  start,
  target,
  allowedMonsters,
  allowedQuests,
}: Args): Generator<[ExpJourney, number]> {
  const quests = Object.fromEntries(
    Object.entries(questsBeforeRates).map<[QuestId, Quest]>(
      ([questId, quest]) => [
        questId as QuestId,
        {
          ...quest,
          ...(isExpQuest(quest)
            ? {
                ...quest,
                reward: isArray(quest.reward)
                  ? quest.reward.map((reward) =>
                      applyRates(reward, EXP_QUEST_RATE),
                    )
                  : applyRates(quest.reward, EXP_QUEST_RATE),
              }
            : {}),
        },
      ],
    ),
  ) as typeof questsBeforeRates;

  const monsters = Object.fromEntries(
    Object.entries(monstersBeforeRates).map<[MonsterId, Monster]>(
      ([monsterId, monster]) => [
        monsterId as MonsterId,
        { ...monster, reward: applyRates(monster.reward, MONSTER_RATE) },
      ],
    ),
  ) as typeof monstersBeforeRates;

  const startExp = isRawExpPoint(start) ? start : getRawExpPoint(start);
  const targetExp = isRawExpPoint(target) ? target : getRawExpPoint(target);
  const monsterBaseLvlThresholds = getMonsterBaseLvlThresholds(allowedMonsters);

  // Graph representation
  const graph = new Map<QuestId, ReadonlyArray<QuestId>>();
  const inDegree = new Map<QuestId, number>();

  for (const questId of allowedQuests) {
    graph.set(questId, []);
    inDegree.set(questId, 0);
  }

  for (const questId of allowedQuests) {
    const quest = quests[questId];

    if (!isExpQuest(quest)) {
      continue;
    }

    for (const prereqId of quest.prerequisite?.questIds ?? []) {
      graph.get(prereqId).push(questId);
      inDegree.set(questId, (inDegree.get(questId) || 0) + 1);
    }
  }

  // Heuristic function: XP needed to reach target / monster XP per kill
  function heuristic(
    currentExp: RawExpPoint,
    monsterReward: ExpReward,
  ): number {
    const base = Math.max(
      0,
      Math.ceil((targetExp.baseExp - currentExp.baseExp) / monsterReward.base),
    );

    const job = Math.max(
      0,
      Math.ceil((targetExp.jobExp - currentExp.jobExp) / monsterReward.job),
    );

    return Math.max(base, job);
  }

  const availableQuests = new Set<QuestId>();

  // Initialize queue with quests that have no prerequisites
  for (const [questId, degree] of inDegree) {
    if (degree === 0) {
      availableQuests.add(questId);
    }
  }

  // A* Search
  const pq = new PriorityQueue<QueuedQuest>();

  pq.enqueue(
    {
      exp: startExp,
      kills: 0,
      completed: new Set(),
      available: availableQuests,
      inDegree,
      steps: [],
      monsterIndex: 0,
      monsterId: MonsterId.Spore,
    },
    heuristic(startExp, monsters[MonsterId.Spore].reward),
  );

  let minKills = Number.POSITIVE_INFINITY;
  let bestSteps: ReadonlyArray<ExpJourneyStep> = [];

  const setBest = (
    newMinKills: number,
    newBestSteps: ReadonlyArray<ExpJourneyStep>,
  ): void => {
    minKills = newMinKills;
    bestSteps = newBestSteps;
    console.log(bestSteps, minKills);
    pq.clear((item) => item.kills >= newMinKills);
  };

  while (!pq.isEmpty()) {
    const queueItem = pq.dequeue();

    if (!queueItem) {
      break;
    }

    const {
      exp,
      kills,
      completed,
      inDegree,
      available,
      steps,
      monsterIndex,
      monsterId,
    } = queueItem;

    // If already reached target level, update the best result
    if (meetsExpRequirements(exp, targetExp) && kills < minKills) {
      setBest(kills, steps);
      yield [bestSteps, minKills];
      continue;
    }

    for (const questId of available) {
      const quest = quests[questId];

      if (!quest) {
        continue;
      }

      let newExp = exp;
      let newLevel = getLevelExpPoint(newExp);
      let newKills = kills;
      let newMonsterIndex = monsterIndex;
      let newMonsterId = monsterId;
      const newSteps = [...steps];

      const applyExp = (
        reward: ExpReward,
        canApplyFullBase: boolean,
        capApplyFullJob: boolean,
      ): void => {
        // TODO optimize, calculation is done in willOverflow already for quests, so it can return how much to add max if we decided to allow lost exp due to max level anyway

        newExp = {
          baseExp:
            newExp.baseExp +
            (OVERLEVEL_PROTECTION && !canApplyFullBase
              ? capExpRewardBase(newExp.baseExp, newLevel.baseLvl, reward.base)
              : reward.base),
          jobExp:
            newExp.jobExp +
            (OVERLEVEL_PROTECTION && !capApplyFullJob
              ? capExpRewardJob(newExp.jobExp, newLevel.jobLvl, reward.job)
              : reward.job),
        };

        newLevel = getLevelExpPoint(newExp);
      };

      const addMonsterStep = (step: ExpJourneyMonsterStep): void => {
        const lastStep = newSteps[newSteps.length - 1];

        if (
          lastStep &&
          isMonsterExpJourneyStep(lastStep) &&
          lastStep.monsterId === step.monsterId
        ) {
          newSteps.pop();
          newSteps.push({
            ...step,
            count: lastStep.count + step.count,
          });
        } else {
          newSteps.push(step);
        }
      };

      const addQuestStep = (step: ExpJourneQuestStep): void => {
        newSteps.push(step);
      };

      const killMonsters = (target: ExpPoint, monsterId: MonsterId) => {
        const [count, reward] = calcMonsterCount(
          newExp,
          target,
          monsters[monsterId],
        );

        applyExp(reward, true, true);
        addMonsterStep({ monsterId, count, expPoint: newLevel });
        newKills += count;
      };

      const getExpFromMonsters = (target: ExpPoint): void => {
        if (monsterBaseLvlThresholds.length - 1 > newMonsterIndex) {
          const [nextMonsterId, nextMonsterThreshold] =
            monsterBaseLvlThresholds[newMonsterIndex + 1]!;

          const nextMonster = monsters[nextMonsterId];
          const nextMonsterQuestId = nextMonster.prerequisite?.questId;

          if (
            nextMonsterQuestId &&
            allowedQuests.includes(nextMonsterQuestId) &&
            !completed.has(nextMonsterQuestId)
          ) {
            // did not complete the quest
            killMonsters(target, newMonsterId);

            return;
          }

          if (nextMonsterThreshold <= newLevel.baseLvl) {
            newMonsterIndex++;
            [newMonsterId] = monsterBaseLvlThresholds[newMonsterIndex]!;

            getExpFromMonsters(target);
            return;
          }

          const targetLevel = isRawExpPoint(target)
            ? getLevelExpPoint(target)
            : target;

          if (nextMonsterThreshold < targetLevel.baseLvl) {
            killMonsters(
              { baseLvl: nextMonsterThreshold, jobLvl: 1 },
              newMonsterId,
            );

            newMonsterIndex++;
            [newMonsterId] = monsterBaseLvlThresholds[newMonsterIndex]!;
          } else if (nextMonsterThreshold === targetLevel.baseLvl) {
            killMonsters(
              { baseLvl: nextMonsterThreshold, jobLvl: 1 },
              newMonsterId,
            );

            newMonsterIndex++;
            [newMonsterId] = monsterBaseLvlThresholds[newMonsterIndex]!;

            return;
          }
        }

        killMonsters(target, newMonsterId);
      };

      const reqExp = ((): RawExpPoint => {
        if (isExpQuest(quest)) {
          return getRawExpPoint({
            baseLvl: quest.prerequisite?.baseLevel ?? 1,
            jobLvl: quest.prerequisite?.jobLevel ?? 1,
          });
        }

        const monster = monsters[quest.kills.monsterId];

        return getRawExpPoint({
          baseLvl: monster.prerequisite?.baseLevel ?? 1,
          jobLvl: 0,
        });
      })();

      if (!meetsExpRequirements(newExp, reqExp)) {
        getExpFromMonsters(reqExp);

        if (newKills >= minKills) {
          continue;
        }
      }

      if (isExpQuest(quest)) {
        const rewards = getRewardsArray(quest.reward);
        const totalReward = getTotalExpReward(rewards);

        // TODO accurately represent switching to next monster type during this
        // TODO is it ok to check just for reaching each of max? prob wont happen in realistic calculations
        const [targetLevel, { reachedMaxBase, reachedMaxJob }] =
          findMinimumLevelForExpReward(
            rewards,
            () => monsters[newMonsterId],
            newExp,
          );

        const willOverlevel =
          targetLevel.baseLvl > newLevel.baseLvl ||
          targetLevel.jobLvl > newLevel.jobLvl;

        if (!willOverlevel) {
          applyExp(
            {
              base: totalReward.base,
              job: totalReward.job,
            },
            true,
            true,
          );
        } else {
          const ignoreOverlevel =
            targetLevel.baseLvl === maxBaseLevel && targetLevel.baseLvl;

          if (!ignoreOverlevel) {
            getExpFromMonsters(targetLevel);
          }

          applyExp(
            {
              base: totalReward.base,
              job: totalReward.job,
            },
            !reachedMaxBase,
            !reachedMaxJob,
          );
        }
      } else {
        const monster = monsters[quest.kills.monsterId];

        applyExp(
          {
            base: quest.kills.count * monster.reward.base,
            job: quest.kills.count * monster.reward.job,
          },
          true,
          true,
        );
      }

      addQuestStep({
        questId,
        expPoint: newLevel,
      });

      const newAvailable = new Set(available);
      newAvailable.delete(quest.id);

      const newInDegree = new Map(inDegree);

      // Reduce in-degree for dependent quests and add them to available set if they become unlocked
      for (const dependent of graph.get(quest.id)) {
        newInDegree.set(
          dependent,
          Math.max(0, (newInDegree.get(dependent) ?? 0) - 1),
        );

        // newInDegree.set(dependent, newInDegree.get(dependent) - 1);

        if (newInDegree.get(dependent) === 0) {
          newAvailable.add(dependent);
        }
      }

      pq.enqueue(
        {
          exp: newExp,
          kills: newKills,
          completed: new Set(completed).add(questId),
          inDegree: newInDegree,
          available: newAvailable,
          steps: newSteps,
          monsterIndex: newMonsterIndex,
          monsterId: newMonsterId,
        },
        newKills + heuristic(newExp, monsters[newMonsterId].reward),
      );
    }

    if (!meetsExpRequirements(exp, targetExp)) {
      const [killsNeeded, receivedExp] = calcMonsterCount(
        exp,
        targetExp,
        monsters[monsterId],
      );

      const newKills = kills + killsNeeded;

      if (newKills < minKills) {
        const finishedExp: RawExpPoint = {
          baseExp: exp.baseExp + receivedExp.base,
          jobExp: exp.jobExp + receivedExp.job,
        };

        const newSteps = [
          ...steps,
          {
            monsterId,
            count: killsNeeded,
            expPoint: getLevelExpPoint(finishedExp),
          } satisfies ExpJourneyMonsterStep,
        ];

        setBest(newKills, newSteps);
        yield [bestSteps, minKills];
      }
    }
  }

  yield [bestSteps, minKills];
}

type QueuedQuest = {
  readonly exp: RawExpPoint;
  readonly kills: number;
  readonly completed: ReadonlySet<QuestId>;
  readonly available: ReadonlySet<QuestId>;
  readonly inDegree: ReadonlyMap<QuestId, number>;
  readonly steps: ReadonlyArray<ExpJourneyStep>;
  readonly monsterIndex: number;
  readonly monsterId: MonsterId;
};

const meetsExpRequirements = (
  current: RawExpPoint,
  requirements: RawExpPoint,
): boolean => {
  const targetRaw = isRawExpPoint(requirements)
    ? requirements
    : getRawExpPoint(requirements);

  return (
    current.baseExp >= targetRaw.baseExp && current.jobExp >= targetRaw.jobExp
  );
};

let generator: ReturnType<typeof getExpJourney> | null = null; // Store generator instance

self.onmessage = (event) => {
  const { baseLvl, jobLvl } = event.data;
  if (typeof baseLvl === 'number' && typeof jobLvl === 'number') {
    generator = getExpJourney({
      start: { baseLvl, jobLvl },
      target: { jobLvl: 50, baseLvl: 1 },
      // allowedQuests: Object.values(QuestId).filter(
      //   (q) =>
      //     q !== QuestId.LostChild &&
      //     q !== QuestId.RachelSanctuary1 &&
      //     q !== QuestId.RachelSanctuary2 &&
      //     q !== QuestId.RachelSanctuarySiroma,
      // ),
      // finishedQuests: [
      //   QuestId.AcolyteTraining,
      //   QuestId.Bruspetti,
      //   QuestId.Friendship,
      // ],
      allowedQuests: Object.values(QuestId),
      allowedMonsters: [
        MonsterId.Spore,
        MonsterId.Metaling,
        MonsterId.Muka,
        MonsterId.Wolf,
      ],
    });
  }

  if (generator) {
    for (const value of generator) {
      self.postMessage({ value, done: false });
    }

    self.postMessage({ value: undefined, done: true });
  }
};
