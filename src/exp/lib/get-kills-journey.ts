import { calcMonsterCount, getLevelExpPoint, getRawExpPoint } from '@/exp/calc';
import { addReward } from '@/exp/lib/add-reward';
import type { Monster } from '@/exp/monsters';
import type {
  ExpJourneyMonsterStep,
} from '@/exp/types/exp-journey';
import type { RawExpPoint } from '@/exp/types/exp-point';
import type { MonsterContext } from '@/exp/types/monster-context';
import type { CurrentMonster, QueueStep } from '@/exp/types/queue-step';

type Args = {
  readonly startExp: RawExpPoint;
  readonly targetExp: RawExpPoint;
  readonly previousQueueStep: QueueStep;
};

export const getKillsJourney = ({
  startExp,
  targetExp,
  previousQueueStep,
}: Args): [ReadonlyArray<ExpJourneyMonsterStep>, totalKills: number, CurrentMonster] => {
  const [steps, currentMonster] = getSteps(
    startExp,
    targetExp,
    previousQueueStep.monster,
    [],
    previousQueueStep.context.monsters,
  );

  const totalKills = steps.reduce(
    (totalKills, step) => totalKills + step.kills,
    0,
  );

  return [steps, totalKills, currentMonster];
};

const getSteps = (
  startExp: RawExpPoint,
  targetExp: RawExpPoint,
  currentMonster: CurrentMonster,
  accumulatedSteps: ReadonlyArray<ExpJourneyMonsterStep>,
  monsters: MonsterContext,
): [ReadonlyArray<ExpJourneyMonsterStep>, CurrentMonster] => {
  const addStep = (
    startExp: RawExpPoint,
    targetExp: RawExpPoint,
    monster: Monster,
  ): ReadonlyArray<ExpJourneyMonsterStep> => [
    ...accumulatedSteps,
    getStep(startExp, targetExp, monster),
  ];

  if (currentMonster.isLast) {
    return [
      addStep(startExp, targetExp, currentMonster.monster),
      currentMonster,
    ];
  }

  const nextThresholdIndex = currentMonster.thresholdIndex + 1;
  const nextMonsterThreshold = monsters.thresholds[nextThresholdIndex];

  if (!nextMonsterThreshold) {
    return [
      addStep(startExp, targetExp, currentMonster.monster),
      currentMonster,
    ];
  }

  const [nextMonsterId, nextMonsterBaseLevel] = nextMonsterThreshold;
  const nextMonster = monsters.get(nextMonsterId);
  const nextCurrentMonster: CurrentMonster = {
    isLast: nextThresholdIndex >= monsters.thresholds.length - 1,
    monster: nextMonster,
    thresholdIndex: nextThresholdIndex,
  };

  const startLevel = getLevelExpPoint(startExp);

  if (startLevel.baseLvl >= nextMonsterBaseLevel) {
    return getSteps(
      startExp,
      targetExp,
      nextCurrentMonster,
      accumulatedSteps,
      monsters,
    );
  }

  const targetLevel = getLevelExpPoint(targetExp);

  if (targetLevel.baseLvl <= nextMonsterBaseLevel) {
    return [
      addStep(startExp, targetExp, currentMonster.monster),
      currentMonster,
    ];
  }

  const nextMonsterExp = getRawExpPoint({
    baseLvl: nextMonsterBaseLevel,
    jobLvl: 1,
  });

  const steps = addStep(startExp, nextMonsterExp, currentMonster.monster);
  const nextExp = steps[steps.length - 1]?.expPoint;

  return getSteps(
    nextExp ? getRawExpPoint(nextExp) : nextMonsterExp,
    targetExp,
    nextCurrentMonster,
    steps,
    monsters,
  );
};

const getStep = (
  startExp: RawExpPoint,
  targetExp: RawExpPoint,
  monster: Monster,
): ExpJourneyMonsterStep => {
  const [kills, reward] = calcMonsterCount(startExp, targetExp, monster);

  const newExp = addReward(startExp, reward);

  return {
    type: 'monster',
    monsterId: monster.id,
    monsterName: monster.name,
    kills,
    expPoint: getLevelExpPoint(newExp),
  };
};
