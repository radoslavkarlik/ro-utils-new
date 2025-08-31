import { EXP_QUEST_RATE, MONSTER_RATE } from '@/exp/constants';
import { compareJourneys } from '@/exp/lib/compare-journeys';
import { exploreQueueJourneys } from '@/exp/lib/explore-queue-journeys';
import { getMonsterContext } from '@/exp/types/monster-context';
import type { MonsterId } from '@/exp/types/monster-id';
import type { QuestId } from '@/exp/types/quest-id';
import { PriorityQueue } from '@/lib/priority-queue';
import { getQuestContext } from '../types/quest-context';
import { type Exp, Journey } from '@/exp/types/journey';
import type { JourneyContext } from '@/exp/types/journey-context';
import type { QuestJourney } from '@/exp/types/quest-journey';
import type { ExpJourney } from '@/exp/types/exp-journey';
import { CurrentMonster } from '@/exp/types/current-monster';

type Args = {
  readonly start: Exp;
  readonly target: Exp;
  readonly allowedQuests: ReadonlySet<QuestId>;
  readonly allowedMonsters: ReadonlySet<MonsterId>;
  readonly completedQuests: ReadonlySet<QuestId>;
};

export function* getExpJourney({
  start,
  target,
  allowedQuests,
  allowedMonsters,
  completedQuests,
}: Args): Generator<ExpJourney> {
  const quests = getQuestContext(
    allowedQuests,
    completedQuests,
    EXP_QUEST_RATE,
  );
  const monsters = getMonsterContext(allowedMonsters, MONSTER_RATE);

  const [availableQuests, lockedQuests] = quests.allQuests.reduce(
    ([available, locked], quest) => {
      const isAvailable = !quest?.prerequisite?.questIds?.some(
        (questId) => !completedQuests.has(questId),
      );

      if (isAvailable) {
        return [[...available, quest.id], locked];
      }

      return [available, [...locked, quest.id]];
    },
    [[], []] as [available: Array<QuestId>, locked: Array<QuestId>],
  );

  const currentMonster = CurrentMonster.create(monsters.allMonsters);

  const questJourney: QuestJourney = {
    completedQuests,
    availableQuests: new Set(availableQuests),
    lockedQuests: new Set(lockedQuests),
  };

  const context: JourneyContext = {
    targetExp: target,
    quests,
    monsters,
  };

  let bestJourney: Journey | null = null;

  const queue = new PriorityQueue<Journey>();

  queue.enqueue(
    new Journey(start, currentMonster, context, questJourney),
    Number.POSITIVE_INFINITY,
  );

  for (const journey of queue) {
    const nextJourneys = exploreQueueJourneys(
      journey,
      () => bestJourney?.totalKills ?? Number.POSITIVE_INFINITY,
    );

    for (const nextJourney of nextJourneys) {
      if (!nextJourney.isFinished) {
        queue.enqueue(nextJourney, nextJourney.totalKills);
        continue;
      }

      if (bestJourney && compareJourneys(nextJourney, bestJourney) >= 0) {
        continue;
      }

      bestJourney = nextJourney;
      yield nextJourney.steps;

      queue.clear(
        (queueJourney) => queueJourney.totalKills >= nextJourney.totalKills,
      );
    }
  }
}
