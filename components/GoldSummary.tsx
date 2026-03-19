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
  return [...raidSelections]
    .sort((a, b) => getRaidGold(b.raidName) - getRaidGold(a.raidName))
    .slice(0, MAX_GOLD_RAIDS)
}

export function GoldSummary({ characters }: GoldSummaryProps) {
  if (characters.length === 0) return null

  let totalEarned = 0
  let totalPotential = 0

  const perChar = characters.map((char) => {
    const goldRaids = getGoldRaids(char.raidSelections)
    const earned = goldRaids.filter((r) => r.isCompleted).reduce((s, r) => s + getRaidGold(r.raidName), 0)
    const potential = goldRaids.reduce((s, r) => s + getRaidGold(r.raidName), 0)
    totalEarned += earned
    totalPotential += potential
    return { ...char, goldRaids, earned, potential }
  })

  const overallPct = totalPotential > 0 ? Math.round((totalEarned / totalPotential) * 100) : 0

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-white">주간 골드 현황</h2>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-28 rounded-full bg-gray-700 overflow-hidden">
            <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${overallPct}%` }} />
          </div>
          <span className="text-sm font-bold text-yellow-400">{totalEarned.toLocaleString()}g</span>
          <span className="text-xs text-gray-500">/ {totalPotential.toLocaleString()}g</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_2fr_1fr] text-xs text-gray-600 border-b border-gray-800/60 px-4 py-1.5">
        <span>캐릭터</span>
        <span className="text-center">레이드</span>
        <span className="text-right">골드</span>
      </div>

      {/* One row per character */}
      <div className="divide-y divide-gray-800/60">
        {perChar.map((char) => (
          <div key={char.name} className="grid grid-cols-[1fr_2fr_1fr] items-center gap-3 px-4 py-2.5">
            {/* Section 1: Character */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{char.name}</p>
              <p className="text-xs text-gray-500">{char.itemLevel.toLocaleString()}</p>
            </div>

            {/* Section 2: Raids */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {char.goldRaids.length === 0 ? (
                <span className="text-xs text-gray-600">—</span>
              ) : (
                char.goldRaids.map((raid) => (
                  <span
                    key={raid.raidName}
                    className={
                      raid.isCompleted
                        ? "text-xs text-gray-600 line-through"
                        : "text-xs text-gray-200 font-medium"
                    }
                  >
                    {raid.raidName}
                  </span>
                ))
              )}
            </div>

            {/* Section 3: Gold */}
            <div className="text-right">
              <p className="text-sm font-medium text-yellow-400">{char.earned.toLocaleString()}g</p>
              <p className="text-xs text-gray-600">/ {char.potential.toLocaleString()}g</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
