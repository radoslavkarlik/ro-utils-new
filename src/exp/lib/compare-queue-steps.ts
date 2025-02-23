import type { QueueStep } from '@/exp/types/queue-step';
import { numericallyAsc } from '@/lib/sort-by';

export const compareQueueSteps = (
  questStep: QueueStep,
  other: QueueStep,
): number => {
  const killsDiff = numericallyAsc(questStep.kills, other.kills);

  if (killsDiff) {
    return killsDiff;
  }

  // return other.completedQuests.size - questStep.completedQuests.size;

  return numericallyAsc(
    questStep.completedQuests.size,
    other.completedQuests.size,
  );
};
