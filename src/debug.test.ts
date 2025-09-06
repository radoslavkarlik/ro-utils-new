import { getExpJourney } from '@/exp/lib/get-exp-journey';
import { Exp } from '@/exp/types/exp';
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
      expRates: {
        quest: 1,
        monster: 1,
      },
      overcapSettings: {
        ignoreWaste: 'short-of-target',
        allowPercentWasteQuests: new Map([[QuestId.LostChild, 2]]),
      },
    }).toArray();
  });
});
