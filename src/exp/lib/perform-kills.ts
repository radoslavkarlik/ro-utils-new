import { getKillsJourney } from '@/exp/lib/get-kills-journey';
import type { Journey } from '@/exp/types/journey';

export const performKills = (
  journey: Journey,
  getBestJourneyKills: () => number,
): Journey | null => {
  const newJourney = journey.split();

  const killsJourney = getKillsJourney({
    startExp: newJourney.exp,
    targetExp: newJourney.context.targetExp,
    currentMonster: newJourney.monster,
    completedQuests: newJourney.quests.completedQuests,
  });

  newJourney.addKills(killsJourney);

  if (newJourney.totalKills >= getBestJourneyKills()) {
    return null;
  }

  return newJourney;
};
