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
import {
  ignoreOverlevelSettings,
  type IgnoreOverlevelSettings,
} from "@/exp/types/overcap-settings";
import { QuestId } from "@/exp/types/quest-id";
import { cn } from "@/lib/cn";
import { Fragment, useCallback, useEffect, useState } from "react";

export function ExpApp() {
  const [startBaseLvl, setStartBaseLvl] = useState(11);
  const [startJobLvl, setStartJobLvl] = useState(1);
  const [targetBaseLvl, setTargetBaseLvl] = useState(1);
  const [targetJobLvl, setTargetJobLvl] = useState(50);

  const [questRates, setQuestRates] = useState(1);
  const [monsterRates, setMonsterRates] = useState(1);

  const [ignoreOverlevel, setIgnoreOverlevel] =
    useState<IgnoreOverlevelSettings>("short-of-target");
  const [allowPercentWaste, setAllowPercentWaste] = useState(10);

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
      startBaseLvl,
      startJobLvl,
      targetBaseLvl,
      targetJobLvl,
      completedQuests,
      allowedMonsters,
      expRates: {
        quest: questRates,
        monster: monsterRates,
      },
      overcapSettings: {
        ignoreOverlevel,
        allowPercentWaste,
      },
    });

    return () => cleanUp();
  }, [
    startBaseLvl,
    startJobLvl,
    targetBaseLvl,
    targetJobLvl,
    completedQuests,
    allowedMonsters,
    questRates,
    monsterRates,
    ignoreOverlevel,
    allowPercentWaste,
    startGenerator,
  ]);

  return (
    <div className="flex gap-3">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-2 gap-y-1">
          <div className="col-span-full grid grid-cols-subgrid">
            <label className="font-medium">Quest rates</label>
            <input
              className="border border-red-700"
              value={questRates}
              onChange={(e) =>
                setQuestRates(Number(e.currentTarget.value) || 1)
              }
            />
            <label className="font-medium">Monster rates</label>
            <input
              className="border border-red-700"
              value={monsterRates}
              onChange={(e) =>
                setMonsterRates(Number(e.currentTarget.value) || 1)
              }
            />
          </div>
          <div className="col-span-full grid grid-cols-subgrid">
            <label className="font-medium">Start base</label>
            <input
              className="border border-red-700"
              value={startBaseLvl}
              onChange={(e) =>
                setStartBaseLvl(Number(e.currentTarget.value) || 1)
              }
            />
            <label className="font-medium">Start job</label>
            <input
              className="border border-red-700"
              value={startJobLvl}
              onChange={(e) =>
                setStartJobLvl(Number(e.currentTarget.value) || 1)
              }
            />
          </div>
          <div className="col-span-full grid grid-cols-subgrid">
            <label className="font-medium">Target base</label>
            <input
              className="border border-red-700"
              value={targetBaseLvl}
              onChange={(e) =>
                setTargetBaseLvl(Number(e.currentTarget.value) || 1)
              }
            />
            <label className="font-medium">Target job</label>
            <input
              className="border border-red-700"
              value={targetJobLvl}
              onChange={(e) =>
                setTargetJobLvl(Number(e.currentTarget.value) || 1)
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-[min-content_min-content] gap-x-2 gap-y-2">
          <div className="col-span-full grid grid-cols-subgrid">
            <label className="whitespace-nowrap font-medium">
              Ignore overlevel
            </label>
            <select
              className="border border-red-700"
              value={ignoreOverlevel}
              onChange={(e) =>
                setIgnoreOverlevel(
                  e.currentTarget.value as IgnoreOverlevelSettings
                )
              }
            >
              {ignoreOverlevelSettings.map((setting) => (
                <option key={setting} value={setting}>
                  {setting}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-full grid grid-cols-subgrid">
            <label className="whitespace-nowrap font-medium">
              Allow percent waste
            </label>
            <input
              className="border border-red-700"
              value={allowPercentWaste}
              onChange={(e) =>
                setAllowPercentWaste(Number(e.currentTarget.value) || 0)
              }
            />
          </div>
        </div>
        <div
          className={cn(
            "grid grid-cols-[repeat(2,min-content)] gap-x-10",
            isFinished && "text-green-800"
          )}
        >
          <div className="col-span-full font-semibold text-black">
            Journey path
          </div>
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
        <div className="font-medium">Completed quests</div>
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
        <div className="font-medium">Allowed monsters</div>
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
