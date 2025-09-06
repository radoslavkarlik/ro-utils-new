import {
  getBaseExp,
  getBaseLevel,
  getJobExp,
  getJobLevel,
  maxBaseLevel,
  maxBaseRaw,
  maxJobLevel,
  maxJobRaw,
} from '@/exp/calc';
import {
  emptyRawExp,
  isRawExpPoint,
  type LevelExpPoint,
  type RawExpPoint,
} from '@/exp/types/exp-point';

export class Exp {
  #baseExp = 0;
  #jobExp = 0;
  #baseLvl = 0;
  #jobLvl = 0;

  constructor(exp: LevelExpPoint | RawExpPoint) {
    if (isRawExpPoint(exp)) {
      this.#baseExp = Math.min(maxBaseRaw, exp.baseExp);
      this.#jobExp = Math.min(maxJobRaw, exp.jobExp);
      this.#baseLvl = getBaseLevel(exp.baseExp);
      this.#jobLvl = getJobLevel(exp.jobExp);
    } else {
      this.#baseLvl = Math.min(maxBaseLevel, exp.baseLvl);
      this.#jobLvl = Math.min(maxJobLevel, exp.jobLvl);
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

export const emptyExp = new Exp(emptyRawExp);
