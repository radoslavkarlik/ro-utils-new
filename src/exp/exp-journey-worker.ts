import { getExpJourney } from '@/exp/lib/get-exp-journey';
import { MonsterId } from '@/exp/types/monster-id';
import { QuestId } from '@/exp/types/quest-id';

export type ExpJourneyWorkerArgs = {
  readonly baseLvl: number;
  readonly jobLvl: number;
  readonly completedQuests: ReadonlyArray<QuestId>;
}

self.onmessage = (event) => {
  const { baseLvl, jobLvl, completedQuests } = event.data as ExpJourneyWorkerArgs;

  const start = performance.now();
  const generator = getExpJourney({
    start: { baseLvl, jobLvl },
    target: { jobLvl: 50, baseLvl: 1 },
    // allowedQuests: Object.values(QuestId).filter(
    //   (q) =>
    //     q !== QuestId.LostChild &&
    //     q !== QuestId.RachelSanctuary1 &&
    //     q !== QuestId.RachelSanctuary2 &&
    //     q !== QuestId.RachelSanctuarySiroma,
    // ),
    allowedQuests: new Set(Object.values(QuestId)),
    allowedMonsters: new Set([
      MonsterId.Spore,
      // MonsterId.Metaling,
      MonsterId.Muka,
      MonsterId.Wolf,
    ]),
    completedQuests: new Set(completedQuests),
  });

  for (const value of generator) {
    self.postMessage({ value, done: false });
  }

  const end = performance.now();
  const seconds = (end - start) / 1000;
  self.postMessage({ value: seconds, done: true });
};
