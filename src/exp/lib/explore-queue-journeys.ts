import { performKills } from '@/exp/lib/perform-kills';
import { performQuest } from '@/exp/lib/perform-quest';
import type { Journey } from '@/exp/types/journey';

export function* exploreQueueJourneys(
  journey: Journey,
  getBestJourneyKills: () => number,
): Generator<Journey> {
  if (journey.isValid) {
    const finalMonsterJourney = performKills(journey, getBestJourneyKills);

    if (finalMonsterJourney) {
      yield finalMonsterJourney;
    }
  }

  const newQuestJourneys = journey.quests.availableQuests
    .values()
    .map((questId) => performQuest(journey, getBestJourneyKills, questId));

  for (const newQuestJourney of newQuestJourneys) {
    if (newQuestJourney) {
      yield newQuestJourney;
    }
  }
}
