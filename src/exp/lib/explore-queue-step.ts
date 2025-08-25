import { performKills } from '@/exp/lib/perform-kills';
import { performQuest } from '@/exp/lib/perform-quest';
import type { QueueStep } from '@/exp/types/queue-step';

export const exploreQueueStep = (step: QueueStep, bestStepKills: number): ReadonlyArray<QueueStep> => {
  const finalMonsterStep = performKills(step);

  const performNextQuest = performQuest(step, bestStepKills)
  const nextQuestSteps = step.availableQuests.values().map(performNextQuest).filter(step => !!step);

  return [finalMonsterStep, ...nextQuestSteps];
};
