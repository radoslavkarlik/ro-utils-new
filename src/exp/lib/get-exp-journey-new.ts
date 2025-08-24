import { getRawExpPoint, meetsExpRequirements } from '@/exp/calc';
import { EXP_QUEST_RATE, MONSTER_RATE } from '@/exp/constants';
import { compareQueueSteps } from '@/exp/lib/compare-queue-steps';
import { estimateFinalKillCount } from '@/exp/lib/estimate-final-kill-count';
import { exploreQueueStep } from '@/exp/lib/explore-queue-step';
import type { ExpJourney } from '@/exp/types/exp-journey';
import { type ExpPoint, isRawExpPoint } from '@/exp/types/exp-point';
import { getMonsterContext } from '@/exp/types/monster-context';
import type { MonsterId } from '@/exp/types/monster-id';
import type { QuestId } from '@/exp/types/quest-id';
import type { QueueStep } from '@/exp/types/queue-step';
import { PriorityQueue } from '@/lib/priority-queue';
import { getQuestContext } from '../types/quest-context';

type Args = {
  readonly start: ExpPoint;
  readonly target: ExpPoint;
  readonly allowedQuests: ReadonlySet<QuestId>;
  readonly allowedMonsters: ReadonlySet<MonsterId>;
};

export function* getExpJourney({
  start,
  target,
  allowedQuests,
  allowedMonsters,
}: Args): Generator<ExpJourney> {
  const quests = getQuestContext(EXP_QUEST_RATE);
  const monsters = getMonsterContext(allowedMonsters, MONSTER_RATE);

  const startExp = isRawExpPoint(start) ? start : getRawExpPoint(start);
  const targetExp = isRawExpPoint(target) ? target : getRawExpPoint(target);

  const availableQuests = allowedQuests
    .values()
    .filter((questId) => !quests.get(questId)?.prerequisite?.questIds?.length)
    .toArray();

  const initialMonsterId = monsters.thresholds[0]?.[0]

  if (!initialMonsterId) {
    throw new Error('Initial monster id not found: ' + initialMonsterId);
  }

  const initialStep: QueueStep = {
    exp: startExp,
    monster: {
      monster: monsters.get(initialMonsterId),
      isLast: monsters.thresholds.length === 1,
      thresholdIndex: 0,
    },
    kills: 0,
    completedQuests: new Set(),
    availableQuests: new Set(availableQuests),
    journey: [],
    context: {
      targetExp,
      quests,
      monsters,
    },
  };

  let bestStep: QueueStep = {
    ...initialStep,
    kills: Number.POSITIVE_INFINITY,
  };

  const queue = new PriorityQueue<QueueStep>();
  queue.enqueue(initialStep, estimateFinalKillCount(initialStep, targetExp));

  for (const step of queue) {
    if (meetsExpRequirements(step.exp, targetExp)) {
      if (compareQueueSteps(step, bestStep) < 0) {
        bestStep = step;

        yield step.journey;
        // TODO maybe clear even when equal
        queue.clear((step) => step.kills > bestStep.kills);
      }
    } else {
      const nextSteps = exploreQueueStep(step);

      for (const nextStep of nextSteps) {
        queue.enqueue(nextStep, estimateFinalKillCount(nextStep, targetExp));
      }
    }
  }
}
