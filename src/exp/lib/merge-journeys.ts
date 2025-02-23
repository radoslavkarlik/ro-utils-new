import { addMonsterJourneyStep } from '@/exp/lib/add-monster-journey-step';
import {
  type ExpJourney,
  isMonsterExpJourneyStep,
} from '@/exp/types/exp-journey';

export const mergeJourneys = (
  journey: ExpJourney,
  other: ExpJourney,
): ExpJourney =>
  other.reduce(
    (newJourney, step) =>
      isMonsterExpJourneyStep(step)
        ? addMonsterJourneyStep(newJourney, step)
        : newJourney,
    journey,
  );
