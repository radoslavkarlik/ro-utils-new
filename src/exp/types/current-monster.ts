import type { Monster } from '@/exp/monsters';
import type { Exp } from '@/exp/types/exp';
import type { QuestId } from '@/exp/types/quest-id';
import { numericallyAsc, sortByProp } from '@/lib/sort-by';

export type MonsterThreshold = {
  readonly monster: Monster;
  readonly baseLevel: number;
  readonly quests: ReadonlySet<QuestId>;
};

export type RelevantThreshold = {
  readonly current: MonsterThreshold;
  readonly next: MonsterThreshold | undefined;
};

export class CurrentMonster {
  #thresholds: ReadonlyArray<RelevantThreshold>;

  static create(monsters: ReadonlyArray<Monster>): CurrentMonster {
    const thresholds = monsters
      .map<MonsterThreshold>((monster) => ({
        monster: monster,
        baseLevel: monster.prerequisite?.baseLevel ?? 1,
        quests: monster.prerequisite?.questId
          ? new Set([monster.prerequisite.questId])
          : new Set(),
      }))
      .sort(
        sortByProp({
          select: ({ baseLevel }) => baseLevel,
          compare: numericallyAsc,
        }),
      )
      .map<RelevantThreshold>((threshold, index, arr) => ({
        current: threshold,
        next: arr[index + 1],
      }));

    return new CurrentMonster(thresholds);
  }

  private constructor(thresholds: ReadonlyArray<RelevantThreshold>) {
    this.#thresholds = thresholds;
  }

  public split(): CurrentMonster {
    return new CurrentMonster(this.#thresholds);
  }

  public catchUp(exp: Exp, completedQuests: ReadonlySet<QuestId>): void {
    const index = this.#thresholds.findIndex(
      ({ next }) =>
        !next ||
        next.baseLevel > exp.level.baseLvl ||
        !!next.quests.difference(completedQuests).size,
    );

    this.#thresholds = this.#thresholds.slice(index);
  }

  public getRelevantThresholds(
    completedQuests: ReadonlySet<QuestId>,
  ): ReadonlyArray<RelevantThreshold> {
    const index = this.#thresholds.findIndex(
      ({ current }) => !!current.quests.difference(completedQuests).size,
    );

    if (index === -1) {
      return this.#thresholds;
    }

    return this.#thresholds.slice(0, index);
  }
}
