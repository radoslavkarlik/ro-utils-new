import type { ExpJourneyWorkerArgs } from "@/exp/exp-journey-worker";
import WorkerURL from "@/exp/exp-journey-worker.ts?worker";
import { monsters } from "@/exp/monsters";
import { quests } from "@/exp/quests";
import {
  type ExpJourney,
  isMonsterExpJourneyStep,
} from "@/exp/types/exp-journey";
import type { Exp } from "@/exp/types/journey";
import { MonsterId } from "@/exp/types/monster-id";
import { QuestId } from "@/exp/types/quest-id";
import { cn } from "@/lib/cn";
import { Fragment, useCallback, useEffect, useState } from "react";

export function ExpApp() {
  const [baseLvl, setBaseLvl] = useState(11);
  const [jobLvl, setJobLvl] = useState(1);
  const [completedQuests, setCompletedQuests] = useState<
    ReadonlyArray<QuestId>
  >([]);
  const [allowedMonsters, setAllowedMonsters] = useState<
    ReadonlyArray<MonsterId>
  >([MonsterId.Spore, MonsterId.Muka, MonsterId.Wolf, MonsterId.Metaling]);

  const { value, startGenerator } = useGeneratorWorker();
  const [steps, isFinished, totalSeconds] = value;

  useEffect(() => {
    const cleanUp = startGenerator({
      baseLvl,
      jobLvl,
      completedQuests,
      allowedMonsters,
    });

    return () => cleanUp();
  }, [baseLvl, jobLvl, completedQuests, allowedMonsters, startGenerator]);

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
                <ExpPoint point={step.exp} />
              </Fragment>
            ) : (
              <Fragment key={index}>
                <div>{QuestId[step.questId]}</div> <ExpPoint point={step.exp} />
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
            <label key={quest.id} className="flex gap-1">
              <input
                type="checkbox"
                defaultChecked={isCompleted}
                onChange={() =>
                  setCompletedQuests((prev) => {
                    if (isCompleted) {
                      return prev.filter((questId) => questId !== quest.id);
                    }

                    return [...prev, quest.id];
                  })
                }
              />
              {quest.id}
            </label>
          );
        })}
      </div>
      <div className="flex flex-col gap-1">
        {Object.values(monsters).map((monster) => {
          const isAllowed = allowedMonsters.includes(monster.id);

          return (
            <label key={monster.id} className="flex gap-1">
              <input
                type="checkbox"
                defaultChecked={isAllowed}
                onChange={() =>
                  setAllowedMonsters((prev) => {
                    if (isAllowed) {
                      return prev.filter(
                        (monsterId) => monsterId !== monster.id
                      );
                    }

                    return [...prev, monster.id];
                  })
                }
              />
              {monster.name}
            </label>
          );
        })}
      </div>
    </div>
  );
}

type ExpPointProps = {
  readonly point: Exp;
};

function ExpPoint({ point }: ExpPointProps) {
  return (
    <div>
      {point.level.baseLvl.toFixed(2)}/{point.level.jobLvl.toFixed(2)}
    </div>
  );
}

const useGeneratorWorker = () => {
  const [value, setValue] = useState<[ExpJourney, boolean, number]>([
    [],
    false,
    0,
  ]);
  const [worker, setWorker] = useState(new WorkerURL());

  useEffect(() => {
    worker.onmessage = (event) => {
      if (typeof event.data.value === "number") {
        setValue(([steps]) => [steps, true, event.data.value]);
      } else {
        setValue([event.data.value, false, 0]);
      }
    };

    worker.onerror = (event) => {
      console.error(event.message);
    };

    return () => worker.terminate(); // Cleanup worker on unmount
  }, [worker]);

  const startGenerator = useCallback((args: ExpJourneyWorkerArgs) => {
    const worker = new WorkerURL();
    setWorker(worker);

    worker.postMessage(args); // Pass arguments to worker

    return () => worker.terminate();
  }, []);

  return { value, startGenerator };
};
