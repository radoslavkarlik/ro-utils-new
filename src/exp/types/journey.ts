import {
  getBaseExp,
  getBaseLevel,
  getJobExp,
  getJobLevel,
  meetsExpRequirements,
} from '@/exp/calc';
import type { KillsJourney } from '@/exp/lib/get-kills-journey';
import { mergeJourneys } from '@/exp/lib/merge-journeys';
import type { ExpJourneyStep } from '@/exp/types/exp-journey';
import {
  isRawExpPoint,
  type LevelExpPoint,
  type RawExpPoint,
} from '@/exp/types/exp-point';
import type { JourneyContext } from '@/exp/types/journey-context';
import type { QuestJourney } from '@/exp/types/quest-journey';
import type { CurrentMonster } from '@/exp/types/current-monster';
import { produce } from 'immer';
import type { Quest } from '@/exp/types/quest';

export class Exp {
  #baseExp = 0;
  #jobExp = 0;
  #baseLvl = 0;
  #jobLvl = 0;

  constructor(exp: LevelExpPoint | RawExpPoint) {
    if (isRawExpPoint(exp)) {
      this.#baseExp = exp.baseExp;
      this.#jobExp = exp.jobExp;
      this.#baseLvl = getBaseLevel(exp.baseExp);
      this.#jobLvl = getJobLevel(exp.jobExp);
    } else {
      this.#baseLvl = exp.baseLvl;
      this.#jobLvl = exp.jobLvl;
      this.#baseExp = getBaseExp(exp.baseLvl);
      this.#jobExp = getJobExp(exp.jobLvl);
    }
  }

  public get level(): LevelExpPoint {
    return {
      baseLvl: this.#baseLvl,
      jobLvl: this.#jobLvl,
    };
  }

  public get raw(): RawExpPoint {
    return {
      baseExp: this.#baseExp,
      jobExp: this.#jobExp,
    };
  }
}

export class Journey {
  #exp: Exp;
  #totalKills = 0;
  #steps: ReadonlyArray<ExpJourneyStep> = [];
  #monster: CurrentMonster;
  #quests: QuestJourney;
  #context: JourneyContext;

  constructor(
    exp: Exp,
    monster: CurrentMonster,
    context: JourneyContext,
    quest: QuestJourney,
  ) {
    this.#exp = exp;
    this.#monster = monster;
    this.#context = context;
    this.#quests = quest;
  }

  public get totalKills(): number {
    return this.#totalKills;
  }

  public get steps(): ReadonlyArray<ExpJourneyStep> {
    return this.#steps;
  }

  public get exp(): Exp {
    return this.#exp;
  }

  public get context(): JourneyContext {
    return this.#context;
  }

  public get quests(): QuestJourney {
    return this.#quests;
  }

  public get monster(): CurrentMonster {
    return this.#monster;
  }

  public split(): Journey {
    const newJourney = new Journey(
      this.exp,
      this.#monster.split(),
      this.#context,
      this.#quests,
    );

    newJourney.#steps = this.#steps;
    newJourney.#totalKills = this.#totalKills;
    newJourney.#exp = this.#exp;

    return newJourney;
  }

  public get isFinished(): boolean {
    return meetsExpRequirements(this.#exp, this.#context.targetExp);
  }

  public get isValid(): boolean {
    return this.#quests.mandatoryQuests.every((mandatoryQuests) =>
      mandatoryQuests
        .values()
        .some((mandatoryQuest) =>
          this.#quests.completedQuests.has(mandatoryQuest),
        ),
    );
  }

  private addSteps(steps: ReadonlyArray<ExpJourneyStep>): void {
    this.#steps = mergeJourneys(this.#steps, steps);
  }

  public addKills(journey: KillsJourney): void {
    this.#totalKills += journey.totalKills;

    const newExp = journey.steps[journey.steps.length - 1]?.exp;

    if (newExp !== undefined) {
      this.#exp = newExp;
    }

    this.addSteps(journey.steps);
  }

  public addExp(step: ExpJourneyStep): void {
    this.#exp = step.exp;
    this.addSteps([step]);
  }

  public completeQuest(quest: Quest): void {
    const questId = quest.id;

    this.#quests = produce(this.#quests, (quests) => {
      quests.completedQuests.add(questId);
      quests.availableQuests.delete(questId);

      const unlockedQuests = this.#quests.lockedQuests
        .values()
        .map(this.#context.quests.get)
        .filter(
          (quest) =>
            !quest.prerequisite?.questIds ||
            quest.prerequisite.questIds.every((questId) =>
              quests.completedQuests.has(questId),
            ),
        );

      for (const quest of unlockedQuests) {
        quests.availableQuests.add(quest.id);
        quests.lockedQuests.delete(quest.id);
      }

      if (quest.isPrerequisiteOnly) {
        const mandatoryQuests = this.#context.quests.allQuests
          .filter((quest) => quest.prerequisite?.questIds?.includes(questId))
          .map((quest) => quest.id);

        quests.mandatoryQuests.push(new Set(mandatoryQuests));
      }
    });
  }
}
