import WorkerURL from '@/exp/lib/get-exp-journey.ts?worker';
import { monsters } from '@/exp/monsters';
import {
  type ExpJourney,
  isMonsterExpJourneyStep,
} from '@/exp/types/exp-journey';
import type { LevelExpPoint } from '@/exp/types/exp-point';
import { QuestId } from '@/exp/types/quest-id';
import { Fragment, useCallback, useEffect, useState } from 'react';

export function ExpApp() {
  const [baseLvl, setBaseLvl] = useState(11);
  const [jobLvl, setJobLvl] = useState(1);

  const { value, startGenerator } = useGeneratorWorker();
  const [steps, totalKillCount] = value;

  useEffect(() => {
    const cleanUp = startGenerator(baseLvl, jobLvl);

    return () => {
      cleanUp();
    };
  }, [baseLvl, jobLvl, startGenerator]);

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
        {totalKillCount}
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

const useGeneratorWorker = () => {
  const [value, setValue] = useState<[ExpJourney, number]>([
    [],
    Number.POSITIVE_INFINITY,
  ]);
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    const newWorker = new WorkerURL();

    setWorker(newWorker);

    newWorker.onmessage = (event) => {
      setValue(event.data.value);
    };

    return () => newWorker.terminate(); // Cleanup worker on unmount
  }, []);

  const startGenerator = useCallback(
    (baseLvl: number, jobLvl: number) => {
      worker?.postMessage({ baseLvl, jobLvl }); // Pass arguments to worker

      return () => worker?.terminate();
    },
    [worker],
  );

  return { value, startGenerator };
};
