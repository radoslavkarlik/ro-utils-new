import { getRawExpPoint } from '@/exp/calc';
import { getKillsJourney } from '@/exp/lib/get-kills-journey';
import { mergeJourneys } from '@/exp/lib/merge-journeys';
import type { QueueStep } from '@/exp/types/queue-step';

export const performKills = (previousStep: QueueStep): QueueStep => {
  const [killsJourney, totalKills, currentMonster] = getKillsJourney({
    startExp: previousStep.exp,
    targetExp: previousStep.context.targetExp,
    previousQueueStep: previousStep,
  });

  const finishedLevel = killsJourney[killsJourney.length - 1]?.expPoint;
  const exp = finishedLevel ? getRawExpPoint(finishedLevel) : previousStep.exp;

  return {
    ...previousStep,
    monster: currentMonster,
    kills: previousStep.kills + totalKills,
    exp,
    journey: mergeJourneys(previousStep.journey, killsJourney),
  };
};
