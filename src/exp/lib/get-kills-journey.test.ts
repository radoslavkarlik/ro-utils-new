import { getLevelExpPoint, getRawExpPoint } from "@/exp/calc"
import { getKillsJourney } from "@/exp/lib/get-kills-journey"
import { ExpJourneyMonsterStep } from "@/exp/types/exp-journey";
import { getMonsterContext } from "@/exp/types/monster-context";
import { MonsterId } from "@/exp/types/monster-id";
import { getQuestContext } from "@/exp/types/quest-context";
import { QuestId } from "@/exp/types/quest-id";
import { QueueStep } from "@/exp/types/queue-step";

describe('getKillsJourney', () => {
    it('Correctly computes journey between 11 and 50 with rates 1', () => {
        const monsterContext = getMonsterContext(new Set([
                    MonsterId.Spore,
                    MonsterId.Muka,
                    MonsterId.Wolf,
                    MonsterId.Metaling,
                ]), 1);

        const startExp = getRawExpPoint({ baseLvl: 11, jobLvl: 1 });
        const targetExp = getRawExpPoint({ baseLvl: 50, jobLvl: 1 });
        const queueStep: QueueStep = {
            availableQuests: new Set(),
            completedQuests: new Set([QuestId.AcolyteTraining]),
            lockedQuests: new Set(),
            context: {
                monsters: monsterContext,
                quests: getQuestContext(new Set(), 1),
                targetExp,
            },
            exp: startExp,
            journey: [],
            kills: 50,
            monster: {
                isLast: false,
                monster: monsterContext.get(MonsterId.Spore),
                thresholdIndex: 0,
            },
        };

        const [journey, kills, currentMonster] = getKillsJourney({ startExp, targetExp, previousQueueStep: queueStep });

        expect(journey).toHaveLength(3);

        expect(journey.at(0)).toStrictEqual({
            type: 'monster',
            expPoint: getLevelExpPoint({
                baseExp: 22189,
                jobExp: 34344,
            }),
            kills: 318,
            monsterId: MonsterId.Spore,
            monsterName: monsterContext.get(MonsterId.Spore).name,
        } satisfies ExpJourneyMonsterStep);

        expect(journey.at(1)).toStrictEqual({
            type: 'monster',
            expPoint: getLevelExpPoint({
                baseExp: 413398,
                jobExp: 206304,
            }),
            kills: 1433,
            monsterId: MonsterId.Muka,
            monsterName: monsterContext.get(MonsterId.Muka).name,
        } satisfies ExpJourneyMonsterStep);

         expect(journey.at(2)).toStrictEqual({
            type: 'monster',
            expPoint: getLevelExpPoint({
                baseExp: 784181,
                jobExp: 430577,
            }),
            kills: 1127,
            monsterId: MonsterId.Wolf,
            monsterName: monsterContext.get(MonsterId.Wolf).name,
        } satisfies ExpJourneyMonsterStep);

        expect(kills).toEqual(2878);

        expect(currentMonster.isLast).toBeFalsy()
        expect(currentMonster.monster).toStrictEqual(monsterContext.get(MonsterId.Wolf))
    })
})