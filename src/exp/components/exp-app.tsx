import type { ExpJourneyWorkerArgs } from "@/exp/exp-journey-worker";
import WorkerURL from "@/exp/exp-journey-worker.ts?worker";
import { monsters } from "@/exp/monsters";
import { quests } from "@/exp/quests";
import { emptyExp } from "@/exp/types/exp";
import {
  type ExpJourney,
  isMonsterExpJourneyStep,
} from "@/exp/types/exp-journey";
import type { Exp } from "@/exp/types/exp";
import { MonsterId } from "@/exp/types/monster-id";
import {
  ignoreWasteSettings,
  type IgnoreWasteSettings,
} from "@/exp/types/overcap-settings";
import { QuestId } from "@/exp/types/quest-id";
import { cn } from "@/lib/cn";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { subtractRawExp } from "@/exp/types/exp-point";
import { getRewardsArray } from "@/exp/types/quest";
import { addRewards, emptyReward } from "@/exp/types/exp-reward";
import type { ExpRates } from "@/exp/types/exp-rates";
import { getQuestContext } from "@/exp/types/quest-context";

export function ExpApp() {
  const [startBaseLvl, setStartBaseLvl] = useState(11);
  const [startJobLvl, setStartJobLvl] = useState(1);
  const [targetBaseLvl, setTargetBaseLvl] = useState(1);
  const [targetJobLvl, setTargetJobLvl] = useState(50);

  const [questRates, setQuestRates] = useState(1);
  const [monsterRates, setMonsterRates] = useState(1);

  const [allowPercentWaste, setAllowPercentWaste] = useState(10);
  const [ignoreWaste, setIgnoreWaste] =
    useState<IgnoreWasteSettings>("short-of-target");

  const [completedQuests, setCompletedQuests] = useState<
    ReadonlyArray<QuestId>
  >([]);
  const [allowedMonsters, setAllowedMonsters] = useState<
    ReadonlyArray<MonsterId>
  >([MonsterId.Spore, MonsterId.Muka, MonsterId.Wolf, MonsterId.Metaling]);

  const { value, startGenerator } = useGeneratorWorker();
  const [{ steps, expRates }, isFinished, totalSeconds] = value;

  const questsContext = useMemo(
    () =>
      getQuestContext(
        new Set(Object.values(QuestId)),
        new Set(),
        expRates.quest
      ),
    [expRates]
  );

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
        ignoreWaste: ignoreWaste,
        allowPercentWaste,
      },
    });

    return () => cleanUp?.();
  }, [
    startBaseLvl,
    startJobLvl,
    targetBaseLvl,
    targetJobLvl,
    completedQuests,
    allowedMonsters,
    questRates,
    monsterRates,
    ignoreWaste,
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
              type="number"
              value={questRates}
              onChange={(e) => {
                if (!Number.isNaN(e.currentTarget.valueAsNumber)) {
                  setQuestRates(e.currentTarget.valueAsNumber);
                }
              }}
            />
            <label className="font-medium">Monster rates</label>
            <input
              className="border border-red-700"
              type="number"
              value={monsterRates}
              onChange={(e) => {
                if (!Number.isNaN(e.currentTarget.valueAsNumber)) {
                  setMonsterRates(e.currentTarget.valueAsNumber);
                }
              }}
            />
          </div>
          <div className="col-span-full grid grid-cols-subgrid">
            <label className="font-medium">Start base</label>
            <input
              className="border border-red-700"
              type="number"
              value={startBaseLvl}
              onChange={(e) => {
                if (!Number.isNaN(e.currentTarget.valueAsNumber)) {
                  setStartBaseLvl(e.currentTarget.valueAsNumber);
                }
              }}
            />
            <label className="font-medium">Start job</label>
            <input
              className="border border-red-700"
              type="number"
              value={startJobLvl}
              onChange={(e) => {
                if (!Number.isNaN(e.currentTarget.valueAsNumber)) {
                  setStartJobLvl(e.currentTarget.valueAsNumber);
                }
              }}
            />
          </div>
          <div className="col-span-full grid grid-cols-subgrid">
            <label className="font-medium">Target base</label>
            <input
              className="border border-red-700"
              type="number"
              value={targetBaseLvl}
              onChange={(e) => {
                if (!Number.isNaN(e.currentTarget.valueAsNumber)) {
                  setTargetBaseLvl(e.currentTarget.valueAsNumber);
                }
              }}
            />
            <label className="font-medium">Target job</label>
            <input
              className="border border-red-700"
              type="number"
              value={targetJobLvl}
              onChange={(e) => {
                if (!Number.isNaN(e.currentTarget.valueAsNumber)) {
                  setTargetJobLvl(e.currentTarget.valueAsNumber);
                }
              }}
            />
          </div>
        </div>
        <div className="grid grid-cols-[min-content_min-content] gap-x-2 gap-y-2">
          <div className="col-span-full grid grid-cols-subgrid">
            <label className="whitespace-nowrap font-medium">
              Allow percent waste
            </label>
            <input
              className="border border-red-700"
              type="number"
              value={allowPercentWaste}
              onChange={(e) => {
                if (!Number.isNaN(e.currentTarget.valueAsNumber)) {
                  setAllowPercentWaste(e.currentTarget.valueAsNumber);
                }
              }}
            />
          </div>
          <div className="col-span-full grid grid-cols-subgrid">
            <label className="whitespace-nowrap font-medium">
              Ignore waste
            </label>
            <select
              className="border border-red-700"
              value={ignoreWaste}
              onChange={(e) =>
                setIgnoreWaste(e.currentTarget.value as IgnoreWasteSettings)
              }
            >
              {ignoreWasteSettings.map((setting) => (
                <option key={setting} value={setting}>
                  {setting}
                </option>
              ))}
            </select>
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
          {steps.map((step, index) => {
            if (isMonsterExpJourneyStep(step)) {
              return (
                <Fragment key={index}>
                  <div className="whitespace-nowrap">
                    {step.kills} {step.monsterName}
                  </div>
                  <ExpPoint point={step.exp} />
                </Fragment>
              );
            }

            const quest = questsContext.get(step.questId);
            const isExpQuest = quest.type === "exp";

            const [lostBasePercent, lostJobPercent] = ((): [number, number] => {
              if (!isExpQuest) {
                return [0, 0];
              }

              const previousStepExp = steps[index - 1]?.exp ?? emptyExp;

              const gainedExp = subtractRawExp(
                step.exp.raw,
                previousStepExp.raw
              );

              const questExp = getRewardsArray(quest.reward).reduce(
                (acc, reward) => addRewards(acc, reward),
                emptyReward
              );

              const lostBasePercent =
                (1 - gainedExp.baseExp / questExp.base) * 100;
              const lostJobPercent =
                (1 - gainedExp.jobExp / questExp.job) * 100;

              return [lostBasePercent, lostJobPercent];
            })();

            const hasLoss = lostBasePercent > 0 || lostJobPercent > 0;
            const lostBoth = lostBasePercent > 0 && lostJobPercent > 0;

            return (
              <Fragment key={index}>
                <div className="flex gap-1">
                  <span>{QuestId[step.questId]}</span>
                  <span className="whitespace-nowrap text-red-700">
                    {hasLoss &&
                      ` (${
                        lostBasePercent
                          ? `Base: ${lostBasePercent.toFixed(2)}`
                          : ""
                      }${lostBoth ? "%/" : ""}${
                        lostJobPercent
                          ? `Job: ${lostJobPercent.toFixed(2)}`
                          : ""
                      })%`}
                  </span>
                </div>{" "}
                <ExpPoint point={step.exp} />
              </Fragment>
            );
          })}
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
  const [value, setValue] = useState<
    [
      { readonly steps: ExpJourney; readonly expRates: ExpRates },
      boolean,
      number
    ]
  >([{ steps: [], expRates: { quest: 1, monster: 1 } }, false, 0]);
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

  const startGenerator = useDebouncedCallback((args: ExpJourneyWorkerArgs) => {
    const worker = new WorkerURL();
    setWorker(worker);

    worker.postMessage(args); // Pass arguments to worker

    return () => worker.terminate();
  }, 200);

  return { value, startGenerator };
};
