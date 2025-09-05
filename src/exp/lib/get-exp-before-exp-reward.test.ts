import { getExpBeforeExpReward } from '@/exp/lib/get-exp-before-exp-reward';
import { MIN_EXP_REWARD } from '@/exp/quests';
import { CurrentMonster } from '@/exp/types/current-monster';
import { Exp } from '@/exp/types/exp';
import type { LevelExpPoint } from '@/exp/types/exp-point';
import { Journey } from '@/exp/types/journey';
import type { JourneyContext } from '@/exp/types/journey-context';
import { getMonsterContext } from '@/exp/types/monster-context';
import { MonsterId } from '@/exp/types/monster-id';
import { getQuestContext } from '@/exp/types/quest-context';
import { QuestId } from '@/exp/types/quest-id';
import type { QuestJourney } from '@/exp/types/quest-journey';

const monsters = getMonsterContext(
  new Set([
    MonsterId.Spore,
    MonsterId.Muka,
    MonsterId.Wolf,
    MonsterId.Metaling,
  ]),
  1,
);
const startExp = new Exp({ baseLvl: 1, jobLvl: 1 });
const availableQuests = new Set(Object.values(QuestId));
const completedQuests = new Set([QuestId.AcolyteTraining]);
const quest: QuestJourney = {
  availableQuests,
  completedQuests,
  lockedQuests: new Set(),
  mandatoryQuests: [],
};
const context: JourneyContext = {
  overcapSettings: {
    ignoreWaste: 'short-of-target',
    allowPercentWaste: 0,
  },
  monsters,
  quests: getQuestContext(availableQuests, completedQuests, 1),
  targetExp: new Exp({ baseLvl: 1, jobLvl: 50 }),
};

describe('getExpBeforeExpReward', () => {
  test('returns correct base level for base exp only', () => {
    const monster = CurrentMonster.create(monsters.allMonsters);
    const journey = new Journey(startExp, monster, context, quest);
    getExpBeforeExpReward(journey, [
      {
        base: 900_000,
        job: MIN_EXP_REWARD,
      },
    ]);

    expect(journey.exp.level).toStrictEqual({
      baseLvl: 63.00033568867983,
      jobLvl: 46.2772723625738,
    } satisfies LevelExpPoint);
  });

  test('returns correct job level for job exp only', () => {
    const monster = CurrentMonster.create(monsters.allMonsters);
    const journey = new Journey(startExp, monster, context, quest);
    getExpBeforeExpReward(journey, [{ base: 1, job: 600_000 }]);

    expect(journey.exp.level).toStrictEqual({
      baseLvl: 62.52184946937003,
      jobLvl: 46.00015529115798,
    } satisfies LevelExpPoint);
  });

  test('returns correct base and job level for both base and job exp', () => {
    const monster = CurrentMonster.create(monsters.allMonsters);
    const journey = new Journey(startExp, monster, context, quest);
    getExpBeforeExpReward(journey, [{ base: 900_000, job: 600_000 }]);

    expect(journey.exp.level).toStrictEqual({
      baseLvl: 63.00033568867983,
      jobLvl: 46.2772723625738,
    } satisfies LevelExpPoint);
  });

  test('returns correct base and job level for both base and job exp if the exp is highest possible to satisfy the minimum level', () => {
    const startExp = new Exp({ baseExp: 21, jobExp: 0 });
    const monster = CurrentMonster.create(monsters.allMonsters);
    const journey = new Journey(startExp, monster, context, quest);
    getExpBeforeExpReward(journey, [
      {
        base: 1399,
        job: MIN_EXP_REWARD,
      },
    ]);

    expect(journey.exp.level).toStrictEqual({
      baseLvl: 14,
      jobLvl: 14.383966244725737,
    } satisfies LevelExpPoint);
  });

  test('returns correct base and job level for batched quests', () => {
    const monster = CurrentMonster.create(monsters.allMonsters);
    const journey = new Journey(startExp, monster, context, quest);
    getExpBeforeExpReward(journey, [
      { base: 2_000, job: 2_000 },
      { base: MIN_EXP_REWARD, job: 1_000 },
      { base: 5_000, job: 3_000 },
    ]);

    expect(journey.exp.level).toStrictEqual({
      baseLvl: 24.22164536741214,
      jobLvl: 22.595663265306122,
    } satisfies LevelExpPoint);
  });

  test('returns correct base level according to provided thresholds', () => {
    const startExp = new Exp({ baseLvl: 44, jobLvl: 23 });
    const monster = CurrentMonster.create(monsters.allMonsters);
    const journey = new Journey(startExp, monster, context, quest);
    getExpBeforeExpReward(journey, [
      { base: 90_000, job: 12_000 },
      { base: 30_000, job: 12_000 },
      { base: 139731, job: 12_000 },
    ]);

    expect(journey.exp.level).toStrictEqual({
      baseLvl: 45.042999708998785,
      jobLvl: 25.75464133182254,
    } satisfies LevelExpPoint);
  });
});
