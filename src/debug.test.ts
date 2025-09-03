import { getExpJourney } from '@/exp/lib/get-exp-journey';
import { Exp } from '@/exp/types/journey';
import { MonsterId } from '@/exp/types/monster-id';
import { QuestId } from '@/exp/types/quest-id';
import { enableMapSet } from 'immer';

enableMapSet();

describe('', () => {
  test('', () => {
    getExpJourney({
      start: new Exp({ baseLvl: 11, jobLvl: 1 }),
      target: new Exp({ baseLvl: 1, jobLvl: 50 }),
      allowedQuests: new Set(Object.values(QuestId)),
      allowedMonsters: new Set([
        MonsterId.Spore,
        MonsterId.Muka,
        MonsterId.Wolf,
      ]),
      completedQuests: new Set(),
    }).toArray();
  });
});
