import { getKillsJourney } from '@/exp/lib/get-kills-journey';
import { CurrentMonster } from '@/exp/types/current-monster';
import type { ExpJourneyMonsterStep } from '@/exp/types/exp-journey';
import { Exp } from '@/exp/types/journey';
import { getMonsterContext } from '@/exp/types/monster-context';
import { MonsterId } from '@/exp/types/monster-id';
import { QuestId } from '@/exp/types/quest-id';

describe('getKillsJourney', () => {
  it('Correctly computes journey between 11 and 50 with rates 1', () => {
    const monsterContext = getMonsterContext(
      new Set([
        MonsterId.Spore,
        MonsterId.Muka,
        MonsterId.Wolf,
        MonsterId.Metaling,
      ]),
      1,
    );

    const startExp = new Exp({ baseLvl: 11, jobLvl: 1 });
    const targetExp = new Exp({ baseLvl: 50, jobLvl: 1 });

    const currentMonster = CurrentMonster.create(monsterContext.allMonsters);
    const completedQuests = new Set([QuestId.AcolyteTraining]);

    const killsJourney = getKillsJourney({
      startExp,
      targetExp,
      currentMonster,
      completedQuests,
    });

    expect(killsJourney.steps).toHaveLength(3);

    expect(killsJourney.steps.at(0)).toStrictEqual({
      type: 'monster',
      exp: new Exp({
        baseExp: 22189,
        jobExp: 34344,
      }),
      kills: 318,
      monsterId: MonsterId.Spore,
      monsterName: monsterContext.get(MonsterId.Spore).name,
    } satisfies ExpJourneyMonsterStep);

    expect(killsJourney.steps.at(1)).toStrictEqual({
      type: 'monster',
      exp: new Exp({
        baseExp: 413398,
        jobExp: 206304,
      }),
      kills: 1433,
      monsterId: MonsterId.Muka,
      monsterName: monsterContext.get(MonsterId.Muka).name,
    } satisfies ExpJourneyMonsterStep);

    expect(killsJourney.steps.at(2)).toStrictEqual({
      type: 'monster',
      exp: new Exp({
        baseExp: 784181,
        jobExp: 430577,
      }),
      kills: 1127,
      monsterId: MonsterId.Wolf,
      monsterName: monsterContext.get(MonsterId.Wolf).name,
    } satisfies ExpJourneyMonsterStep);

    expect(killsJourney.totalKills).toEqual(2878);

    expect(
      currentMonster.getRelevantThresholds(completedQuests).length,
    ).toBeGreaterThan(1);
    expect(
      currentMonster.getRelevantThresholds(completedQuests).at(0)?.current
        .monster,
    ).toStrictEqual(monsterContext.get(MonsterId.Wolf));
  });
});
