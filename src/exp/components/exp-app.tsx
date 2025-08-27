import WorkerURL from "@/exp/exp-journey-worker.ts?worker";
import { quests } from "@/exp/quests";
import {
  type ExpJourney,
  isMonsterExpJourneyStep,
} from "@/exp/types/exp-journey";
import type { LevelExpPoint } from "@/exp/types/exp-point";
import { QuestId } from "@/exp/types/quest-id";
import { cn } from "@/lib/cn";
import { Fragment, useCallback, useEffect, useState } from "react";

export function ExpApp() {
  const [baseLvl, setBaseLvl] = useState(11);
  const [jobLvl, setJobLvl] = useState(1);
  const [completedQuests, setCompletedQuests] = useState<
    ReadonlyArray<QuestId>
  >([]);

  const { value, startGenerator } = useGeneratorWorker();
  const [steps, isFinished, totalSeconds] = value;

  useEffect(() => {
    const cleanUp = startGenerator(baseLvl, jobLvl, completedQuests);

    return () => {
      cleanUp();
    };
  }, [baseLvl, jobLvl, completedQuests, startGenerator]);

  return (
    <div className="flex gap-3">
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
        <div
          className={cn(
            "grid grid-cols-[repeat(2,min-content)] gap-x-10",
            isFinished && "text-green-800"
          )}
        >
          {steps.map((step, index) =>
            isMonsterExpJourneyStep(step) ? (
              <Fragment key={index}>
                <div className="whitespace-nowrap">
                  {step.kills} {step.monsterName}
                </div>
                <ExpPoint point={step.expPoint} />
              </Fragment>
            ) : (
              <Fragment key={index}>
                <div>{QuestId[step.questId]}</div>{" "}
                <ExpPoint point={step.expPoint} />
              </Fragment>
            )
          )}
          <div className="mt-3">
            {isFinished && <div>Seconds: {totalSeconds}</div>}
            {Object.entries(
              Object.groupBy(
                steps.filter(isMonsterExpJourneyStep),
                (step) => step.monsterName
              )
            ).map(([monsterName, steps]) => (
              <div key={monsterName} className="whitespace-nowrap">
                {monsterName}:{" "}
                {steps?.reduce(
                  (totalKills, step) => totalKills + step.kills,
                  0
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {Object.values(quests).map((quest) => {
          const isCompleted = completedQuests.includes(quest.id);

          return (
            <label key={quest.id}>
              <input
                type="checkbox"
                defaultChecked={isCompleted}
                onChange={() =>
                  setCompletedQuests((prev) => {
                    if (isCompleted) {
                      return prev.filter((questId) => questId !== quest.id);
                    } else {
                      return [...prev, quest.id];
                    }
                  })
                }
              />
              {quest.id}
            </label>
          );
        })}
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
  const [value, setValue] = useState<[ExpJourney, boolean, number]>([
    [],
    false,
    0,
  ]);
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    const newWorker = new WorkerURL();

    setWorker(newWorker);

    newWorker.onmessage = (event) => {
      if (typeof event.data.value === "number") {
        setValue(([steps]) => [steps, true, event.data.value]);
        newWorker.terminate();
      } else {
        setValue([event.data.value, false, 0]);
      }
    };

    return () => newWorker.terminate(); // Cleanup worker on unmount
  }, []);

  const startGenerator = useCallback(
    (
      baseLvl: number,
      jobLvl: number,
      completedQuests: ReadonlyArray<QuestId>
    ) => {
      worker?.postMessage({ baseLvl, jobLvl, completedQuests }); // Pass arguments to worker

      return () => worker?.terminate();
    },
    [worker]
  );

  return { value, startGenerator };
};
