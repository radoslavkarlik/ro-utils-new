import { getExpJourney } from '@/exp/lib/get-exp-journey';
import type { ExpRates } from '@/exp/types/exp-rates';
import { Exp } from '@/exp/types/journey';
import type { MonsterId } from '@/exp/types/monster-id';
import type { OvercapSettings } from '@/exp/types/overcap-settings';
import { QuestId } from '@/exp/types/quest-id';
import { enableMapSet } from 'immer';

enableMapSet();

export type ExpJourneyWorkerArgs = {
  readonly startBaseLvl: number;
  readonly startJobLvl: number;
  readonly targetBaseLvl: number;
  readonly targetJobLvl: number;
  readonly completedQuests: ReadonlyArray<QuestId>;
  readonly allowedMonsters: ReadonlyArray<MonsterId>;
  readonly expRates: ExpRates;
  readonly overcapSettings: OvercapSettings;
};

self.onmessage = (event) => {
  const {
    startBaseLvl,
    startJobLvl,
    targetBaseLvl,
    targetJobLvl,
    completedQuests,
    allowedMonsters,
    expRates,
    overcapSettings,
  } = event.data as ExpJourneyWorkerArgs;

  const start = performance.now();

  try {
    const generator = getExpJourney({
      start: new Exp({ baseLvl: startBaseLvl, jobLvl: startJobLvl }),
      target: new Exp({ baseLvl: targetBaseLvl, jobLvl: targetJobLvl }),
      allowedQuests: new Set(Object.values(QuestId)),
      allowedMonsters: new Set(allowedMonsters),
      completedQuests: new Set(completedQuests),
      expRates,
      overcapSettings,
    });

    for (const value of generator) {
      self.postMessage({
        value: value.map((step) => ({
          ...step,
          exp: {
            level: step.exp.level,
          },
        })),
        done: false,
      });
    }

    const end = performance.now();
    const seconds = (end - start) / 1000;
    self.postMessage({ value: seconds, done: true });
  } catch (error) {
    console.error(error);
    const end = performance.now();
    const seconds = (end - start) / 1000;
    self.postMessage({ value: seconds, done: true });
  }
};
