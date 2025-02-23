import {
  type ExpJourney,
  type ExpJourneyMonsterStep,
  isMonsterExpJourneyStep,
} from '@/exp/types/exp-journey';

export const addMonsterJourneyStep = (
  journey: ExpJourney,
  step: ExpJourneyMonsterStep,
): ExpJourney => {
  const lastStep = journey[journey.length - 1];
  const newSteps = [...journey];

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

  return newSteps;
};
