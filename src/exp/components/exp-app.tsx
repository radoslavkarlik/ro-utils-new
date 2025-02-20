import { getExpJourney } from '@/exp/lib/get-exp-journey-old';
import { monsters } from '@/exp/monsters';
import { isMonsterExpJourneyStep } from '@/exp/types/exp-journey';
import type { LevelExpPoint } from '@/exp/types/exp-point';
import { MonsterId } from '@/exp/types/monster-id';
import { QuestId } from '@/exp/types/quest-id';
import { Fragment, useMemo, useState } from 'react';

export function ExpApp() {
  const [baseLvl, setBaseLvl] = useState(11);
  const [jobLvl, setJobLvl] = useState(1);

  const steps = useMemo(
    () =>
      getExpJourney({
        start: { baseLvl, jobLvl },
        target: { jobLvl: 50, baseLvl: 1 },
        // allowedQuests: Object.values(QuestId).filter(
        //   (q) =>
        //     q !== QuestId.LostChild &&
        //     q !== QuestId.RachelSanctuary1 &&
        //     q !== QuestId.RachelSanctuary2 &&
        //     q !== QuestId.RachelSanctuarySiroma,
        // ),
        // finishedQuests: [
        //   QuestId.AcolyteTraining,
        //   QuestId.Bruspetti,
        //   QuestId.Friendship,
        // ],
        allowedQuests: Object.values(QuestId),
        finishedQuests: [],
        allowedMonsters: [
          MonsterId.Spore,
          // MonsterId.Metaling,
          MonsterId.Muka,
          MonsterId.Wolf,
        ],
      }),
    [baseLvl, jobLvl],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          className="border border-red-700"
          value={baseLvl}
          onChange={(e) => setBaseLvl(Number(e.currentTarget.value) || 1)}
        />
        <input
          className="border border-red-700"
          value={jobLvl}
          onChange={(e) => setJobLvl(Number(e.currentTarget.value) || 1)}
        />
      </div>
      <div className="grid grid-cols-[repeat(2,min-content)] gap-x-10">
        {steps.map((step, index) =>
          isMonsterExpJourneyStep(step) ? (
            <Fragment key={index}>
              <div>
                {step.count} {monsters[step.monsterId].name}
              </div>
              <ExpPoint point={step.expPoint} />
            </Fragment>
          ) : (
            <Fragment key={index}>
              <div>{QuestId[step.questId]}</div>{' '}
              <ExpPoint point={step.expPoint} />
            </Fragment>
          ),
        )}
        {steps.reduce(
          (total, s) => total + (isMonsterExpJourneyStep(s) ? s.count : 0),
          0,
        )}
      </div>
    </div>
  );
}

type ExpPointProps = {
  readonly point: LevelExpPoint;
};

function ExpPoint({ point }: ExpPointProps) {
  return (
    <div>
      {point.baseLvl.toFixed(2)}/{point.jobLvl.toFixed(2)}
    </div>
  );
}
