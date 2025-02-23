import baseExpChart from '@/data/base-exp-chart.json' with { type: 'json' };
import jobExpChart from '@/data/job-exp-chart-first-class.json' with {
  type: 'json',
};
import {
  calcMonsterCount,
  capExpRewardBase,
  capExpRewardJob,
  getLevelExpPoint,
  getRawExpPoint,
  meetsExpRequirements,
} from '@/exp/calc';
import {
  EXP_QUEST_RATE,
  MONSTER_RATE,
  OVERLEVEL_PROTECTION,
} from '@/exp/constants';
import { findMinimumLevelForExpReward } from '@/exp/lib/find-minimum-level-for-exp-reward';
import {
  type ExpJourney,
  type ExpJourneyMonsterStep,
  type ExpJourneyQuestStep,
  type ExpJourneyStep,
  isMonsterExpJourneyStep,
} from '@/exp/types/exp-journey';
import {
  type ExpPoint,
  type RawExpPoint,
  isRawExpPoint,
} from '@/exp/types/exp-point';
import { type ExpReward, emptyReward } from '@/exp/types/exp-reward';
import { getMonsterContext } from '@/exp/types/monster-context';
import { MonsterId } from '@/exp/types/monster-id';
import {
  getRewardsArray,
  getTotalExpReward,
  isExpQuest,
} from '@/exp/types/quest';
import { getQuestContext } from '@/exp/types/quest-context';
import type { QuestId } from '@/exp/types/quest-id';
import { PriorityQueue } from '@/lib/priority-queue';

const maxBaseLevel = Number(Object.keys(baseExpChart).toReversed()[0]) || 1;
const maxJobLevel = Number(Object.keys(jobExpChart).toReversed()[0]) || 1;

type Args = {
  readonly start: ExpPoint;
  readonly target: ExpPoint;
  readonly allowedQuests: ReadonlySet<QuestId>;
  readonly allowedMonsters: ReadonlySet<MonsterId>;
};

export function* getExpJourney({
  start,
  target,
  allowedMonsters,
  allowedQuests,
}: Args): Generator<ExpJourney> {
  const quests = getQuestContext(EXP_QUEST_RATE);
  const monsters = getMonsterContext(allowedMonsters, MONSTER_RATE);

  const startExp = isRawExpPoint(start) ? start : getRawExpPoint(start);
  const targetExp = isRawExpPoint(target) ? target : getRawExpPoint(target);
  const monsterBaseLvlThresholds = monsters.thresholds;

  // Graph representation
  const graph = new Map<QuestId, ReadonlyArray<QuestId>>();
  const inDegree = new Map<QuestId, number>();

  for (const questId of allowedQuests) {
    graph.set(questId, []);
    inDegree.set(questId, 0);
  }

  const questsToDo = allowedQuests
    .values()
    .map((questId) => quests.get(questId))
    .filter((quest) => !!quest);

  for (const quest of questsToDo) {
    if (!isExpQuest(quest)) {
      continue;
    }

    for (const prereqId of quest.prerequisite?.questIds ?? []) {
      graph.set(prereqId, [...(graph.get(prereqId) ?? []), quest.id]);
      inDegree.set(quest.id, (inDegree.get(quest.id) || 0) + 1);
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
    heuristic(startExp, monsters.get(MonsterId.Spore)?.reward ?? emptyReward),
  );

  let minKills = Number.POSITIVE_INFINITY;
  let bestSteps: ReadonlyArray<ExpJourneyStep> = [];

  const setBest = (
    newMinKills: number,
    newBestSteps: ReadonlyArray<ExpJourneyStep>,
  ): void => {
    minKills = newMinKills;
    bestSteps = newBestSteps;

    pq.clear((item) => item.kills >= newMinKills);
  };

  for (const queueItem of pq) {
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
      yield bestSteps;
      continue;
    }

    for (const questId of available) {
      const quest = quests.get(questId);

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
            kills: lastStep.kills + step.kills,
          });
        } else {
          newSteps.push(step);
        }
      };

      const addQuestStep = (step: ExpJourneyQuestStep): void => {
        newSteps.push(step);
      };

      const killMonsters = (target: ExpPoint, monsterId: MonsterId) => {
        const [count, reward] = calcMonsterCount(
          newExp,
          target,
          monsters.get(monsterId),
        );

        applyExp(reward, true, true);
        addMonsterStep({
          monsterId,
          monsterName: monsters.get(monsterId)?.name,
          kills: count,
          expPoint: newLevel,
        });
        newKills += count;
      };

      const getExpFromMonsters = (target: ExpPoint): void => {
        if (monsterBaseLvlThresholds.length - 1 > newMonsterIndex) {
          const [nextMonsterId, nextMonsterThreshold] =
            monsterBaseLvlThresholds[newMonsterIndex + 1]!;

          const nextMonster = monsters.get(nextMonsterId);
          const nextMonsterQuestId = nextMonster.prerequisite?.questId;

          if (
            nextMonsterQuestId &&
            allowedQuests.has(nextMonsterQuestId) &&
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

        const monster = monsters.get(quest.kills.monsterId);

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
            () => monsters.get(newMonsterId),
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
        const monster = monsters.get(quest.kills.monsterId);

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

      const newCompleted = new Set(completed).add(questId);

      const newAvailable = new Set(available);
      newAvailable.delete(quest.id);

      const newInDegree = new Map(inDegree);

      // Reduce in-degree for dependent quests and add them to available set if they become unlocked
      for (const dependent of graph.get(quest.id)) {
        newInDegree.set(
          dependent,
          Math.max(0, (newInDegree.get(dependent) ?? 0) - 1),
        );

        if (newInDegree.get(dependent) === 0) {
          newAvailable.add(dependent);
        }
      }

      pq.enqueue(
        {
          exp: newExp,
          kills: newKills,
          completed: newCompleted,
          inDegree: newInDegree,
          available: newAvailable,
          steps: newSteps,
          monsterIndex: newMonsterIndex,
          monsterId: newMonsterId,
        },
        newKills + heuristic(newExp, monsters.get(newMonsterId).reward),
      );
    }

    if (!meetsExpRequirements(exp, targetExp)) {
      const [killsNeeded, receivedExp] = calcMonsterCount(
        exp,
        targetExp,
        monsters.get(monsterId),
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
            monsterName: monsters.get(monsterId)?.name,
            kills: killsNeeded,
            expPoint: getLevelExpPoint(finishedExp),
          } satisfies ExpJourneyMonsterStep,
        ];

        setBest(newKills, newSteps);
        yield bestSteps;
      }
    }
  }
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
