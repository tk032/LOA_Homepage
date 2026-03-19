"use client"

import { getRaidGold, MAX_GOLD_RAIDS } from "@/lib/raids"

interface RaidSelection {
  raidName: string
  isCompleted: boolean
}

interface CharacterGoldProps {
  name: string
  itemLevel: number
  raidSelections: RaidSelection[]
}

interface GoldSummaryProps {
  characters: CharacterGoldProps[]
}

function getGoldRaids(raidSelections: RaidSelection[]): RaidSelection[] {
  // Sort by gold desc, take top MAX_GOLD_RAIDS
  return [...raidSelections]
    .sort((a, b) => getRaidGold(b.raidName) - getRaidGold(a.raidName))
    .slice(0, MAX_GOLD_RAIDS)
}

export function GoldSummary({ characters }: GoldSummaryProps) {
  let totalEarned = 0
  let totalPotential = 0

  const perChar = characters.map((char) => {
    const goldRaids = getGoldRaids(char.raidSelections)
    const earned = goldRaids
      .filter((r) => r.isCompleted)
      .reduce((sum, r) => sum + getRaidGold(r.raidName), 0)
    const potential = goldRaids.reduce((sum, r) => sum + getRaidGold(r.raidName), 0)
    totalEarned += earned
    totalPotential += potential
    return { name: char.name, earned, potential }
  })

  const overallPct = totalPotential > 0 ? Math.round((totalEarned / totalPotential) * 100) : 0

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">주간 골드 현황</h2>
        <div className="text-right">
          <span className="text-xl font-bold text-yellow-400">
            🪙 {totalEarned.toLocaleString()}g
          </span>
          <span className="text-sm text-gray-400 ml-1">
            / {totalPotential.toLocaleString()}g
          </span>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-400">
          <span>전체 진행도</span>
          <span>{overallPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-yellow-400 transition-all"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Per-character rows */}
      {perChar.length > 0 && (
        <div className="space-y-2 pt-1">
          {perChar.map((char) => {
            const pct = char.potential > 0 ? Math.round((char.earned / char.potential) * 100) : 0
            return (
              <div key={char.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 truncate max-w-[60%]">{char.name}</span>
                  <span className="text-yellow-400 font-medium">
                    {char.earned.toLocaleString()}g
                    <span className="text-gray-500 font-normal">
                      {" "}/ {char.potential.toLocaleString()}g
                    </span>
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-500/70 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {characters.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-2">
          등록된 캐릭터가 없습니다.
        </p>
      )}
    </div>
  )
}
