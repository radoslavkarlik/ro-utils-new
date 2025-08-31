import { calcMonsterCount, meetsExpRequirements } from '@/exp/calc';
import { addReward } from '@/exp/lib/add-reward';
import type { Monster } from '@/exp/monsters';
import type { CurrentMonster } from '@/exp/types/current-monster';
import type { ExpJourneyMonsterStep } from '@/exp/types/exp-journey';
import { Exp } from '@/exp/types/journey';
import type { QuestId } from '@/exp/types/quest-id';

type Args = {
  readonly startExp: Exp;
  readonly targetExp: Exp;
  readonly currentMonster: CurrentMonster;
  readonly completedQuests: ReadonlySet<QuestId>;
};

export type KillsJourney = {
  readonly steps: ReadonlyArray<ExpJourneyMonsterStep>;
  readonly totalKills: number;
};

export const getKillsJourney = ({
  startExp,
  targetExp,
  currentMonster,
  completedQuests,
}: Args): KillsJourney => {
  const relevantThresholds =
    currentMonster.getRelevantThresholds(completedQuests);

  const steps: Array<ExpJourneyMonsterStep> = [];

  let currentExp = startExp;

  for (const [index, threshold] of relevantThresholds.entries()) {
    const thresholdStep = (() => {
      if (!threshold.next || index >= relevantThresholds.length - 1) {
        return null;
      }

      const thresholdTarget = new Exp({
        baseLvl: threshold.next.baseLevel,
        jobLvl: 1,
      });

      return getStep(currentExp, thresholdTarget, threshold.current.monster);
    })();

    const targetStep = getStep(
      currentExp,
      targetExp,
      threshold.current.monster,
    );

    if (thresholdStep && !meetsExpRequirements(thresholdStep.exp, targetExp)) {
      currentExp = thresholdStep.exp;
      steps.push(thresholdStep);
      continue;
    }

    currentExp = targetStep.exp;
    steps.push(targetStep);
    break;
  }

  currentMonster.catchUp(currentExp, completedQuests);

  const totalKills = steps.reduce(
    (totalKills, step) => totalKills + step.kills,
    0,
  );

  return { steps, totalKills };
};

const getStep = (
  startExp: Exp,
  targetExp: Exp,
  monster: Monster,
): ExpJourneyMonsterStep => {
  const [kills, reward] = calcMonsterCount(startExp, targetExp, monster);

  const newExp = addReward(startExp, reward);

  return {
    type: 'monster',
    monsterId: monster.id,
    monsterName: monster.name,
    kills,
    exp: newExp,
  };
};
