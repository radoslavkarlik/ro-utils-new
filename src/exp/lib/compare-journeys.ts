import type { Journey } from '@/exp/types/journey';
import { numericallyAsc } from '@/lib/sort-by';

export const compareJourneys = (
  queueJourney: Journey,
  other: Journey,
): number => {
  const killsDiff = numericallyAsc(queueJourney.totalKills, other.totalKills);

  if (killsDiff) {
    return killsDiff;
  }

  return numericallyAsc(
    queueJourney.quests.completedQuests.size,
    other.quests.completedQuests.size,
  );
};
