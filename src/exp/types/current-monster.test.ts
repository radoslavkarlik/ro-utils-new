import { CurrentMonster } from '@/exp/types/current-monster';
import { Exp } from '@/exp/types/journey';
import { getMonsterContext } from '@/exp/types/monster-context';
import { MonsterId } from '@/exp/types/monster-id';
import { QuestId } from '@/exp/types/quest-id';

const monsters = getMonsterContext(
  new Set([MonsterId.Spore, MonsterId.Muka, MonsterId.Wolf]),
  1,
);

describe('currentMonster', () => {
  it('cuts off monsters that are completed', () => {
    const currentMonster = CurrentMonster.create(monsters.allMonsters);
    const completedQuests = new Set([QuestId.AcolyteTraining]);

    currentMonster.catchUp(
      new Exp({ baseLvl: 26, jobLvl: 1 }),
      completedQuests,
    );

    expect(
      currentMonster
        .getRelevantThresholds(completedQuests)
        .map(({ current }) => current.monster.id),
    ).toStrictEqual([MonsterId.Muka, MonsterId.Wolf]);
  });

  it('cuts off monsters that are irrelevant', () => {
    const currentMonster = CurrentMonster.create(monsters.allMonsters);
    const completedQuests = new Set<QuestId>();

    currentMonster.catchUp(
      new Exp({ baseLvl: 26, jobLvl: 1 }),
      completedQuests,
    );

    expect(
      currentMonster
        .getRelevantThresholds(completedQuests)
        .map(({ current }) => current.monster.id),
    ).toStrictEqual([MonsterId.Spore]);
  });
});
